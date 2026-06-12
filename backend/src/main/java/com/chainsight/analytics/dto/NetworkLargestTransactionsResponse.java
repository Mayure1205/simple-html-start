package com.chainsight.analytics.dto;

import java.time.LocalDate;
import java.util.List;

public record NetworkLargestTransactionsResponse(
        long chainId,
        LocalDate from,
        LocalDate to,
        int limit,
        List<LargestTransactionResponse> transactions
) {
}
