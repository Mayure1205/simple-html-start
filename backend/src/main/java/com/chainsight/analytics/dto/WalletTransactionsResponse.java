package com.chainsight.analytics.dto;

import java.util.List;

public record WalletTransactionsResponse(
        long chainId,
        String address,
        int page,
        int size,
        long totalTransactions,
        long totalPages,
        List<WalletTransactionResponse> transactions
) {
}
