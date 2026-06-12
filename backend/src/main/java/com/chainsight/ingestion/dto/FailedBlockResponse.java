package com.chainsight.ingestion.dto;

import java.math.BigInteger;
import java.time.Instant;

public record FailedBlockResponse(
        long chainId,
        BigInteger blockNumber,
        String failureReason,
        int retryCount,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
}
