package com.chainsight.analytics.dto;

public record WalletCounterpartyPoint(
        String address,
        String sentWei,
        String receivedWei,
        long sentToCount,
        long receivedFromCount
) {
}
