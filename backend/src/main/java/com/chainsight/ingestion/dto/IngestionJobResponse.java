package com.chainsight.ingestion.dto;

import java.math.BigInteger;

public record IngestionJobResponse(
        long jobId,
        long chainId,
        BigInteger startBlock,
        BigInteger endBlock,
        BigInteger resumeFromBlock,
        long skippedBlocks,
        long processedBlocks,
        long transactionsInserted,
        long failedBlocks,
        String status
) {
}
