package com.chainsight.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyNetworkMetricResponse(
        LocalDate date,
        long blockCount,
        long transactionCount,
        String totalValueWei,
        String averageGasPriceWei,
        BigDecimal averageGasUsed,
        long previousDayTransactionCount,
        long transactionCountDelta,
        long transactionCountRank
) {
}
