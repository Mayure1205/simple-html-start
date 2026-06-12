package com.chainsight.analytics.dto;

import java.time.Instant;

public record WalletSummaryResponse(
        long chainId,
        String address,
        long sentCount,
        long receivedCount,
        String sentValueWei,
        String receivedValueWei,
        String netFlowWei,
        Instant firstActivityAt,
        Instant lastActivityAt
) {
}
