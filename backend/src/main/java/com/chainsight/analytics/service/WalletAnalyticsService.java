package com.chainsight.analytics.service;

import com.chainsight.analytics.dto.WalletSummaryResponse;
import com.chainsight.analytics.dto.WalletTransactionResponse;
import com.chainsight.analytics.dto.WalletTransactionsResponse;
import com.chainsight.analytics.repository.WalletAnalyticsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class WalletAnalyticsService {

    private static final Pattern ETHEREUM_ADDRESS_PATTERN = Pattern.compile("^0x[a-f0-9]{40}$");

    private final WalletAnalyticsRepository repository;
    private final long ethereumChainId;
    private final int maxLimit;

    public WalletAnalyticsService(
            WalletAnalyticsRepository repository,
            @Value("${ethereum.chain-id}") long ethereumChainId,
            @Value("${analytics.network.max-limit}") int maxLimit
    ) {
        this.repository = repository;
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
}
