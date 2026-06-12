package com.chainsight.ingestion.service;

import com.chainsight.ingestion.dto.IngestionResult;
import com.chainsight.ingestion.dto.IngestionJobResponse;
import com.chainsight.ingestion.dto.IngestionStatusResponse;
import com.chainsight.ingestion.dto.StartIngestionRequest;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import com.chainsight.ingestion.repository.BlockJdbcRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigInteger;
import java.util.Objects;
import java.util.Set;
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

    public BlockIngestionService(
            EthereumRpcAdapter rpcAdapter,
            BlockJdbcRepository repository,
            TransactionTemplate transactionTemplate,
            @Value("${ethereum.chain-id}") long ethereumChainId,
            @Value("${ethereum.ingestion.max-range-size}") int maxRangeSize
    ) {
        this.rpcAdapter = rpcAdapter;
        this.repository = repository;
        this.transactionTemplate = transactionTemplate;
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

    public IngestionJobResponse ingestRange(StartIngestionRequest request) {
        validateRequest(request);

        long jobId = repository.createJob(request.chainId(), request.startBlock(), request.endBlock());
        long processedBlocks = 0;
        long insertedTransactions = 0;

        try {
            BigInteger currentBlock = request.startBlock();
            while (currentBlock.compareTo(request.endBlock()) <= 0) {
                IngestionResult result = ingestBlock(currentBlock);
                processedBlocks++;
                insertedTransactions += result.transactionsInserted();
                currentBlock = currentBlock.add(BigInteger.ONE);
            }

            repository.markJobCompleted(jobId);
            return new IngestionJobResponse(
                    jobId,
                    request.chainId(),
                    request.startBlock(),
                    request.endBlock(),
                    processedBlocks,
                    insertedTransactions,
                    0,
                    "COMPLETED"
            );
        } catch (RuntimeException ex) {
            repository.markJobFailed(jobId, ex.getMessage());
            throw ex;
        }
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
}
