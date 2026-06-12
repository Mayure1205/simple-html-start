package com.chainsight.ingestion.model;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;

public record BlockData(
        BigInteger blockNumber,
        String blockHash,
        Instant blockTimestamp,
        BigInteger baseFeePerGasWei,
        Long gasUsed,
        BigInteger gasLimit,
        List<TransactionData> transactions
) {
}
