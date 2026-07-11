package com.chainsight.ingestion.service;

import com.chainsight.ingestion.dto.FailedBlockResponse;
import com.chainsight.ingestion.dto.IngestionResult;
import com.chainsight.ingestion.dto.IngestionJobResponse;
import com.chainsight.ingestion.dto.IngestionJobStatusResponse;
import com.chainsight.ingestion.dto.IngestionStatusResponse;
import com.chainsight.ingestion.dto.StartIngestionRequest;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import com.chainsight.ingestion.repository.BlockJdbcRepository;
import com.chainsight.resilience.RedisIngestionLockService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class BlockIngestionService {

    private static final Logger logger = LoggerFactory.getLogger(BlockIngestionService.class);

    private final EthereumRpcAdapter rpcAdapter;
    private final BlockJdbcRepository repository;
    private final TransactionTemplate transactionTemplate;
    private final long ethereumChainId;
    private final int maxRangeSize;
    private final Executor blockExtractionExecutor;
    private final Executor jobCoordinatorExecutor;
    private final RedisIngestionLockService ingestionLockService;
    private final ConcurrentHashMap<Long, Long> activeRangeJobsByChain = new ConcurrentHashMap<>();

    public BlockIngestionService(
            EthereumRpcAdapter rpcAdapter,
            BlockJdbcRepository repository,
            TransactionTemplate transactionTemplate,
            @Qualifier("blockExtractionExecutor") Executor blockExtractionExecutor,
            @Qualifier("jobCoordinatorExecutor") Executor jobCoordinatorExecutor,
            RedisIngestionLockService ingestionLockService,
            @Value("${ethereum.chain-id}") long ethereumChainId,
            @Value("${ethereum.ingestion.max-range-size}") int maxRangeSize
    ) {
        this.rpcAdapter = rpcAdapter;
        this.repository = repository;
        this.transactionTemplate = transactionTemplate;
        this.blockExtractionExecutor = blockExtractionExecutor;
        this.jobCoordinatorExecutor = jobCoordinatorExecutor;
        this.ingestionLockService = ingestionLockService;
        this.ethereumChainId = ethereumChainId;
        this.maxRangeSize = maxRangeSize;
    }

    public IngestionResult ingestBlock(BigInteger blockNumber) {
        validateBlockNumber(blockNumber, "blockNumber");
        logger.info("Starting ingestion for block {}", blockNumber);

        BlockData blockData = rpcAdapter.fetchBlock(blockNumber);

        IngestionResult result = transactionTemplate.execute(status -> persistBlock(blockData, ethereumChainId));
        if (result == null) {
            throw new IllegalStateException("Block ingestion transaction did not return a result");
        }

        logger.info(
                "Successfully ingested block {} with {} inserted transactions",
                blockNumber,
                result.transactionsInserted()
        );

        return result;
    }

    /**
     * Accepts a range ingestion job and returns immediately with status RUNNING.
     * The range is processed asynchronously on the job-coordinator pool; block
     * fetches run in parallel on the extraction pool while persistence stays
     * sequential in block order, each block in its own ACID transaction.
     * Progress is queryable via the job status endpoint. The Redis lock and the
     * in-memory job slot are released when the async job finishes.
     */
    public IngestionJobResponse ingestRange(StartIngestionRequest request) {
        validateRequest(request);
        acquireRangeJobSlot(request.chainId());

        long jobId = 0;
        String distributedLockToken = null;

        try {
            distributedLockToken = ingestionLockService.acquireRangeLock(
                    request.chainId(),
                    request.startBlock(),
                    request.endBlock()
            );
            jobId = repository.createJob(request.chainId(), request.startBlock(), request.endBlock());
            activeRangeJobsByChain.replace(request.chainId(), 0L, jobId);

            long lastProcessedBlock = repository.getLastProcessedBlock(request.chainId());
            BigInteger resumeFromBlock = nextBlockToProcess(request.startBlock(), lastProcessedBlock);
            long skippedBlocks = skippedBlockCount(request.startBlock(), resumeFromBlock);

            final long submittedJobId = jobId;
            final String lockToken = distributedLockToken;
            CompletableFuture
                    .runAsync(() -> runRangeJob(submittedJobId, request, resumeFromBlock), jobCoordinatorExecutor)
                    .whenComplete((unused, ex) -> {
                        ingestionLockService.releaseRangeLock(request.chainId(), lockToken);
                        releaseRangeJobSlot(request.chainId(), submittedJobId);
                    });

            logger.info(
                    "Accepted range job {} for chain {}: blocks {} to {} (resuming from {})",
                    jobId, request.chainId(), request.startBlock(), request.endBlock(), resumeFromBlock
            );

            return new IngestionJobResponse(
                    jobId,
                    request.chainId(),
                    request.startBlock(),
                    request.endBlock(),
                    resumeFromBlock,
                    skippedBlocks,
                    0,
                    0,
                    0,
                    "RUNNING"
            );
        } catch (RuntimeException ex) {
            if (jobId > 0) {
                repository.markJobFailed(jobId, ex.getMessage());
            }
            if (distributedLockToken != null) {
                ingestionLockService.releaseRangeLock(request.chainId(), distributedLockToken);
            }
            releaseRangeJobSlot(request.chainId(), jobId);
            throw ex;
        }
    }

    private void runRangeJob(long jobId, StartIngestionRequest request, BigInteger resumeFromBlock) {
        long processedBlocks = 0;
        long insertedTransactions = 0;

        try {
            List<BlockExtractionTask> extractionTasks = scheduleBlockExtraction(resumeFromBlock, request.endBlock());
            for (BlockExtractionTask extractionTask : extractionTasks) {
                try {
                    BlockData blockData = extractionTask.future().join();
                    IngestionResult result = persistFetchedBlock(blockData);
                    processedBlocks++;
                    insertedTransactions += result.transactionsInserted();
                } catch (RuntimeException ex) {
                    RuntimeException failure = unwrapCompletionException(ex);
                    repository.recordFailedBlock(request.chainId(), extractionTask.blockNumber(), failure.getMessage());
                    throw failure;
                }
            }

            repository.markJobCompleted(jobId);
            logger.info(
                    "Range job {} completed: {} blocks processed, {} transactions inserted",
                    jobId, processedBlocks, insertedTransactions
            );
        } catch (RuntimeException ex) {
            repository.markJobFailed(jobId, ex.getMessage());
            logger.error(
                    "Range job {} failed after {} blocks: {}",
                    jobId, processedBlocks, ex.getMessage(), ex
            );
        }
    }

    public List<FailedBlockResponse> getFailedBlocks(long chainId, String status) {
        validateSupportedChain(chainId);
        validateFailedBlockStatus(status);
        return repository.findFailedBlocks(chainId, status);
    }

    public IngestionJobStatusResponse getJob(long jobId) {
        if (jobId <= 0) {
            throw new IllegalArgumentException("jobId must be positive");
        }
        IngestionJobStatusResponse response = repository.findJobById(jobId);
        validateSupportedChain(response.chainId());
        return response;
    }

    public IngestionResult retryFailedBlock(long chainId, BigInteger blockNumber) {
        validateSupportedChain(chainId);
        validateBlockNumber(blockNumber, "blockNumber");

        repository.markFailedBlockRetrying(chainId, blockNumber);
        try {
            IngestionResult result = ingestBlock(blockNumber);
            repository.markFailedBlockSuccess(chainId, blockNumber);
            return result;
        } catch (RuntimeException ex) {
            repository.recordFailedBlock(chainId, blockNumber, ex.getMessage());
            throw ex;
        }
    }

    private List<BlockExtractionTask> scheduleBlockExtraction(BigInteger startBlock, BigInteger endBlock) {
        List<BlockExtractionTask> tasks = new ArrayList<>();
        BigInteger currentBlock = startBlock;
        while (currentBlock.compareTo(endBlock) <= 0) {
            BigInteger blockToFetch = currentBlock;
            CompletableFuture<BlockData> future = CompletableFuture.supplyAsync(
                    () -> rpcAdapter.fetchBlock(blockToFetch),
                    blockExtractionExecutor
            );
            tasks.add(new BlockExtractionTask(blockToFetch, future));
            currentBlock = currentBlock.add(BigInteger.ONE);
        }
        return tasks;
    }

    private IngestionResult persistFetchedBlock(BlockData blockData) {
        IngestionResult result = transactionTemplate.execute(status -> persistBlock(blockData, ethereumChainId));
        if (result == null) {
            throw new IllegalStateException("Block ingestion transaction did not return a result");
        }
        return result;
    }

    private RuntimeException unwrapCompletionException(RuntimeException ex) {
        if (ex instanceof CompletionException && ex.getCause() instanceof RuntimeException runtimeException) {
            return runtimeException;
        }
        return ex;
    }

    private BigInteger nextBlockToProcess(BigInteger requestedStartBlock, long lastProcessedBlock) {
        BigInteger checkpointNextBlock = BigInteger.valueOf(lastProcessedBlock).add(BigInteger.ONE);
        return checkpointNextBlock.max(requestedStartBlock);
    }

    private long skippedBlockCount(BigInteger requestedStartBlock, BigInteger resumeFromBlock) {
        BigInteger skippedBlocks = resumeFromBlock.subtract(requestedStartBlock);
        return skippedBlocks.max(BigInteger.ZERO).longValueExact();
    }

    private void acquireRangeJobSlot(long chainId) {
        Long activeJobId = activeRangeJobsByChain.putIfAbsent(chainId, 0L);
        if (activeJobId != null) {
            String jobDescription = activeJobId == 0L ? "starting" : String.valueOf(activeJobId);
            throw new IllegalArgumentException(
                    "Ingestion job " + jobDescription + " is already running for chainId " + chainId
            );
        }
    }

    private void releaseRangeJobSlot(long chainId, long jobId) {
        if (jobId > 0) {
            activeRangeJobsByChain.remove(chainId, jobId);
            return;
        }
        activeRangeJobsByChain.remove(chainId, 0L);
    }

    public void clearActiveRangeJobSlots() {
        activeRangeJobsByChain.clear();
    }

    public IngestionStatusResponse getStatus(long chainId) {
        validateSupportedChain(chainId);
        return new IngestionStatusResponse(
                chainId,
                repository.getLastProcessedBlock(chainId),
                repository.countBlocks(chainId),
                repository.countTransactions(chainId),
                repository.countFailedBlocks(chainId),
                repository.countActiveJobs(chainId)
        );
    }

    private IngestionResult persistBlock(BlockData blockData, long chainId) {
        int blocksInserted = repository.insertBlock(blockData, chainId);
        int transactionsInserted = repository.insertTransactions(
                blockData.transactions(),
                chainId,
                blockData.blockTimestamp()
        );
        repository.upsertWallets(extractWallets(blockData), chainId, blockData.blockTimestamp());
        repository.updateCheckpoint(chainId, blockData.blockNumber());

        return new IngestionResult(
                blockData.blockNumber(),
                blocksInserted,
                blockData.transactions().size(),
                transactionsInserted,
                true,
                "SUCCESS"
        );
    }

    private Set<String> extractWallets(BlockData blockData) {
        return blockData.transactions().stream()
                .flatMap(this::walletAddresses)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private Stream<String> walletAddresses(TransactionData transaction) {
        return Stream.of(transaction.fromAddress(), transaction.toAddress());
    }

    private void validateRequest(StartIngestionRequest request) {
        validateSupportedChain(request.chainId());
        validateBlockNumber(request.startBlock(), "startBlock");
        validateBlockNumber(request.endBlock(), "endBlock");

        if (request.startBlock().compareTo(request.endBlock()) > 0) {
            throw new IllegalArgumentException("startBlock must be less than or equal to endBlock");
        }

        BigInteger rangeSize = request.endBlock()
                .subtract(request.startBlock())
                .add(BigInteger.ONE);
        if (rangeSize.compareTo(BigInteger.valueOf(maxRangeSize)) > 0) {
            throw new IllegalArgumentException("Block range must be " + maxRangeSize + " blocks or fewer");
        }
    }

    private void validateBlockNumber(BigInteger blockNumber, String fieldName) {
        if (blockNumber == null || blockNumber.signum() < 0) {
            throw new IllegalArgumentException(fieldName + " must be a non-negative block number");
        }
    }

    private void validateSupportedChain(long chainId) {
        if (chainId != ethereumChainId) {
            throw new IllegalArgumentException("Only Ethereum chainId " + ethereumChainId + " is supported in MVP");
        }
    }

    private void validateFailedBlockStatus(String status) {
        if (status == null || status.isBlank()) {
            return;
        }
        if (!Set.of("PENDING", "RETRYING", "SUCCESS", "DEAD").contains(status)) {
            throw new IllegalArgumentException("Invalid failed block status: " + status);
        }
    }

    private record BlockExtractionTask(
            BigInteger blockNumber,
            CompletableFuture<BlockData> future
    ) {
    }
}
