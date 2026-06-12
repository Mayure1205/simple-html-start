package com.chainsight.ingestion.dto;

import java.math.BigInteger;

public record IngestionJobResponse(
        long jobId,
        long chainId,
        BigInteger startBlock,
        BigInteger endBlock,
        long processedBlocks,
        long transactionsInserted,
        long failedBlocks,
        String status
) {
}
