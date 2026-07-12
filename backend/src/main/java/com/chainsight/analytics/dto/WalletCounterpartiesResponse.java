package com.chainsight.analytics.dto;

import java.util.List;

public record WalletCounterpartiesResponse(
        long chainId,
        String address,
        List<WalletCounterpartyPoint> counterparties
) {
}
