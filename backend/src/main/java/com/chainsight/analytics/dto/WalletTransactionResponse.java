package com.chainsight.analytics.dto;

import java.time.Instant;

public record WalletTransactionResponse(
        String transactionHash,
        long blockNumber,
        String direction,
        String counterpartyAddress,
        String fromAddress,
        String toAddress,
        String valueWei,
        String gasPriceWei,
        Long gasUsed,
        Integer status,
        Instant blockTimestamp
) {
}
