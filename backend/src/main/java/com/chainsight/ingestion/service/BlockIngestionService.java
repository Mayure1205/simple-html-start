package com.chainsight.ingestion.service;

import com.chainsight.ingestion.dto.IngestionResult;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.repository.BlockJdbcRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;

@Service
public class BlockIngestionService {

    private static final Logger logger = LoggerFactory.getLogger(BlockIngestionService.class);
    private static final long ETHEREUM_CHAIN_ID = 1L;

    private final EthereumRpcAdapter rpcAdapter;
    private final BlockJdbcRepository repository;

    public BlockIngestionService(EthereumRpcAdapter rpcAdapter, BlockJdbcRepository repository) {
        this.rpcAdapter = rpcAdapter;
        this.repository = repository;
    }

    @Transactional
    public IngestionResult ingestBlock(BigInteger blockNumber) {
        logger.info("Starting ingestion for block {}", blockNumber);
        
        // 1. Fetch
        BlockData blockData = rpcAdapter.fetchBlock(blockNumber);

        // 2. Insert Block
        repository.insertBlock(blockData, ETHEREUM_CHAIN_ID);

        // 3. Batch Insert Transactions
        repository.insertTransactions(blockData.getTransactions(), ETHEREUM_CHAIN_ID, blockData.getBlockTimestamp());

        // 4. Update Checkpoint
        repository.updateCheckpoint(ETHEREUM_CHAIN_ID, blockNumber);

        logger.info("Successfully ingested block {} with {} transactions", blockNumber, blockData.getTransactions().size());

        return IngestionResult.builder()
                .blockNumber(blockNumber)
                .transactionsInserted(blockData.getTransactions().size())
                .checkpointUpdated(true)
                .status("SUCCESS")
                .build();
    }
}
