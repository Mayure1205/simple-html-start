package com.chainsight.analytics.controller;

import com.chainsight.analytics.dto.NetworkDailyAnalyticsResponse;
import com.chainsight.analytics.dto.NetworkLargestTransactionsResponse;
import com.chainsight.analytics.service.NetworkAnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/analytics/network")
public class NetworkAnalyticsController {

    private final NetworkAnalyticsService analyticsService;

    public NetworkAnalyticsController(NetworkAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/daily")
    public ResponseEntity<NetworkDailyAnalyticsResponse> getDailyMetrics(
            @RequestParam long chainId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(analyticsService.getDailyMetrics(chainId, from, to));
    }

    @GetMapping("/largest-transactions")
    public ResponseEntity<NetworkLargestTransactionsResponse> getLargestTransactions(
            @RequestParam long chainId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getLargestTransactions(chainId, from, to, limit));
    }
}
