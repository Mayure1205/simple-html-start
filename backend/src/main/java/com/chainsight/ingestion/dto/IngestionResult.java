package com.chainsight.ingestion.dto;

import java.math.BigInteger;

public record IngestionResult(
        BigInteger blockNumber,
        int blocksInserted,
        int transactionsSeen,
        int transactionsInserted,
        boolean checkpointUpdated,
        String status
) {
}
