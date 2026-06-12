package com.chainsight.analytics.dto;

import java.time.LocalDate;
import java.util.List;

public record NetworkDailyAnalyticsResponse(
        long chainId,
        LocalDate from,
        LocalDate to,
        List<DailyNetworkMetricResponse> days
) {
}
