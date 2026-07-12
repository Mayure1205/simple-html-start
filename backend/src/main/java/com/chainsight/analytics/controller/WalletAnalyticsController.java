package com.chainsight.analytics.controller;

import com.chainsight.analytics.dto.*;
import com.chainsight.analytics.service.WalletAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics/wallets")
public class WalletAnalyticsController {

    private final WalletAnalyticsService analyticsService;

    public WalletAnalyticsController(WalletAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/{address}/transactions")
    public ResponseEntity<WalletTransactionsResponse> getTransactions(
            @PathVariable String address,
            @RequestParam long chainId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(analyticsService.getTransactions(chainId, address, page, size));
    }

    @GetMapping("/{address}/summary")
    public ResponseEntity<WalletSummaryResponse> getSummary(
            @PathVariable String address,
            @RequestParam long chainId
    ) {
        return ResponseEntity.ok(analyticsService.getSummary(chainId, address));
    }

    @GetMapping("/{address}/daily-flow")
    public ResponseEntity<WalletDailyFlowResponse> getDailyFlow(
            @PathVariable String address,
            @RequestParam long chainId,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(analyticsService.getDailyFlow(chainId, address, days));
    }

    @GetMapping("/{address}/counterparties")
    public ResponseEntity<WalletCounterpartiesResponse> getCounterparties(
            @PathVariable String address,
            @RequestParam long chainId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getCounterparties(chainId, address, limit));
    }
}
