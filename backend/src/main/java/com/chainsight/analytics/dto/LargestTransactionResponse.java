package com.chainsight.analytics.dto;

import java.time.Instant;

public record LargestTransactionResponse(
        long valueRank,
        String transactionHash,
        long blockNumber,
        String fromAddress,
        String toAddress,
        String valueWei,
        String gasPriceWei,
        Long gasUsed,
        Integer status,
        Instant blockTimestamp
) {
}
