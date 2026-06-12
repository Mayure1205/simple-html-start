package com.chainsight.ingestion.dto;

public record IngestionStatusResponse(
        long chainId,
        long lastProcessedBlock,
        long indexedBlocks,
        long indexedTransactions,
        long failedBlockCount,
        long activeJobCount
) {
}
