package com.chainsight.analytics.dto;

public record WalletDailyFlowPoint(
        String day,
        String inflowWei,
        String outflowWei,
        String netWei,
        long txCount
) {
}
