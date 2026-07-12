package com.chainsight.analytics.dto;

import java.util.List;

public record WalletDailyFlowResponse(
        long chainId,
        String address,
        List<WalletDailyFlowPoint> days
) {
}
