package com.chainsight.analytics.service;

import com.chainsight.analytics.dto.NetworkDailyAnalyticsResponse;
import com.chainsight.analytics.dto.NetworkLargestTransactionsResponse;
import com.chainsight.analytics.repository.NetworkAnalyticsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class NetworkAnalyticsService {

    private final NetworkAnalyticsRepository repository;
    private final long ethereumChainId;
    private final int maxLimit;

    public NetworkAnalyticsService(
            NetworkAnalyticsRepository repository,
            @Value("${ethereum.chain-id}") long ethereumChainId,
            @Value("${analytics.network.max-limit}") int maxLimit
    ) {
        this.repository = repository;
        this.ethereumChainId = ethereumChainId;
        this.maxLimit = maxLimit;
    }

    public NetworkDailyAnalyticsResponse getDailyMetrics(long chainId, LocalDate from, LocalDate to) {
        validateCommonRequest(chainId, from, to);
        return new NetworkDailyAnalyticsResponse(
                chainId,
                from,
                to,
                repository.findDailyMetrics(chainId, from, to)
        );
    }

    public NetworkLargestTransactionsResponse getLargestTransactions(
            long chainId,
            LocalDate from,
            LocalDate to,
            int limit
    ) {
        validateCommonRequest(chainId, from, to);
        validateLimit(limit);
        return new NetworkLargestTransactionsResponse(
                chainId,
                from,
                to,
                limit,
                repository.findLargestTransactions(chainId, from, to, limit)
        );
    }

    private void validateCommonRequest(long chainId, LocalDate from, LocalDate to) {
        validateSupportedChain(chainId);
        if (from == null) {
            throw new IllegalArgumentException("from date is required");
        }
        if (to == null) {
            throw new IllegalArgumentException("to date is required");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from date must be before or equal to to date");
        }
    }

    private void validateSupportedChain(long chainId) {
        if (chainId != ethereumChainId) {
            throw new IllegalArgumentException("Only Ethereum chainId " + ethereumChainId + " is supported in MVP");
        }
    }

    private void validateLimit(int limit) {
        if (limit <= 0) {
            throw new IllegalArgumentException("limit must be positive");
        }
        if (limit > maxLimit) {
            throw new IllegalArgumentException("limit must be " + maxLimit + " or fewer");
        }
    }
}
