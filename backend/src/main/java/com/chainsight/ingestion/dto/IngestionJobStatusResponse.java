package com.chainsight.ingestion.dto;

import java.math.BigInteger;
import java.time.Instant;

public record IngestionJobStatusResponse(
        long jobId,
        long chainId,
        BigInteger startBlock,
        BigInteger endBlock,
        String status,
        Instant startedAt,
        Instant completedAt,
        String failureReason
) {
}
