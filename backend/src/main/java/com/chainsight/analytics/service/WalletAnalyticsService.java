package com.chainsight.analytics.service;

import com.chainsight.analytics.dto.*;
import com.chainsight.analytics.repository.WalletAnalyticsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class WalletAnalyticsService {

    private static final Pattern ETHEREUM_ADDRESS_PATTERN = Pattern.compile("^0x[a-f0-9]{40}$");

    private final WalletAnalyticsRepository repository;
    private final WalletAnalyticsCacheService cacheService;
    private final long ethereumChainId;
    private final int maxLimit;

    public WalletAnalyticsService(
            WalletAnalyticsRepository repository,
            WalletAnalyticsCacheService cacheService,
            @Value("${ethereum.chain-id}") long ethereumChainId,
            @Value("${analytics.network.max-limit}") int maxLimit
    ) {
        this.repository = repository;
        this.cacheService = cacheService;
        this.ethereumChainId = ethereumChainId;
        this.maxLimit = maxLimit;
    }

    public WalletTransactionsResponse getTransactions(long chainId, String address, int page, int size) {
        validateSupportedChain(chainId);
        String normalizedAddress = normalizeAddress(address);
        validatePagination(page, size);

        long totalTransactions = repository.countTransactions(chainId, normalizedAddress);
        List<WalletTransactionResponse> transactions = repository.findTransactions(
                chainId,
                normalizedAddress,
                page,
                size
        );

        return new WalletTransactionsResponse(
                chainId,
                normalizedAddress,
                page,
                size,
                totalTransactions,
                totalPages(totalTransactions, size),
                transactions
        );
    }

    public WalletSummaryResponse getSummary(long chainId, String address) {
        validateSupportedChain(chainId);
        return repository.summarizeWallet(chainId, normalizeAddress(address));
    }

    private void validateSupportedChain(long chainId) {
        if (chainId != ethereumChainId) {
            throw new IllegalArgumentException("Only Ethereum chainId " + ethereumChainId + " is supported in MVP");
        }
    }

    private String normalizeAddress(String address) {
        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("wallet address is required");
        }

        String normalizedAddress = address.toLowerCase(Locale.ROOT);
        if (!ETHEREUM_ADDRESS_PATTERN.matcher(normalizedAddress).matches()) {
            throw new IllegalArgumentException("wallet address must be a 42-character Ethereum address");
        }
        return normalizedAddress;
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must be zero or greater");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("size must be positive");
        }
        if (size > maxLimit) {
            throw new IllegalArgumentException("size must be " + maxLimit + " or fewer");
        }
    }

    private long totalPages(long totalTransactions, int size) {
        if (totalTransactions == 0) {
            return 0;
        }
        return (long) Math.ceil((double) totalTransactions / size);
    }

    public WalletDailyFlowResponse getDailyFlow(long chainId, String address, int days) {
        validateSupportedChain(chainId);
        String normalizedAddress = normalizeAddress(address);
        if (days <= 0 || days > 365) {
            throw new IllegalArgumentException("days must be between 1 and 365");
        }

        Optional<WalletDailyFlowResponse> cached = cacheService.getDailyFlow(chainId, normalizedAddress, days);
        if (cached.isPresent()) {
            return cached.get();
        }

        List<WalletDailyFlowPoint> flowPoints = repository.findDailyFlow(chainId, normalizedAddress, days);
        WalletDailyFlowResponse response = new WalletDailyFlowResponse(chainId, normalizedAddress, flowPoints);
        cacheService.putDailyFlow(response, days);
        return response;
    }

    public WalletCounterpartiesResponse getCounterparties(long chainId, String address, int limit) {
        validateSupportedChain(chainId);
        String normalizedAddress = normalizeAddress(address);
        if (limit <= 0 || limit > maxLimit) {
            throw new IllegalArgumentException("limit must be positive and less than or equal to " + maxLimit);
        }

        Optional<WalletCounterpartiesResponse> cached = cacheService.getCounterparties(chainId, normalizedAddress, limit);
        if (cached.isPresent()) {
            return cached.get();
        }

        List<WalletCounterpartyPoint> counterparties = repository.findCounterparties(chainId, normalizedAddress, limit);
        WalletCounterpartiesResponse response = new WalletCounterpartiesResponse(chainId, normalizedAddress, counterparties);
        cacheService.putCounterparties(response, limit);
        return response;
    }
}
