package com.chainsight.ingestion.model;

import java.math.BigInteger;

public record TransactionData(
        BigInteger blockNumber,
        String transactionHash,
        String fromAddress,
        String toAddress,
        BigInteger valueWei,
        BigInteger gasPriceWei,
        Long gasUsed,
        Integer status
) {
}
