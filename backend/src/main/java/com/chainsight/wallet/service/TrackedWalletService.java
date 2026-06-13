package com.chainsight.wallet.service;

import com.chainsight.wallet.dto.TrackedWalletRequest;
import com.chainsight.wallet.dto.TrackedWalletResponse;
import com.chainsight.wallet.repository.TrackedWalletRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class TrackedWalletService {

    private static final Pattern ETHEREUM_ADDRESS_PATTERN = Pattern.compile("^0x[a-f0-9]{40}$");

    private final TrackedWalletRepository repository;
    private final long ethereumChainId;

    public TrackedWalletService(
            TrackedWalletRepository repository,
            @Value("${ethereum.chain-id}") long ethereumChainId
    ) {
        this.repository = repository;
        this.ethereumChainId = ethereumChainId;
    }

    public List<TrackedWalletResponse> getTrackedWallets(long userId) {
        return repository.findAllForUser(userId);
    }

    public TrackedWalletResponse trackWallet(long userId, TrackedWalletRequest request) {
        validateSupportedChain(request.chainId());
        String walletAddress = normalizeAddress(request.walletAddress());
        String label = normalizeLabel(request.label());

        try {
            return repository.create(userId, request.chainId(), walletAddress, label);
        } catch (DuplicateKeyException ex) {
            throw new IllegalArgumentException("wallet is already tracked by this user");
        }
    }

    public void deleteTrackedWallet(long userId, long walletId) {
        int deleted = repository.deleteForUser(userId, walletId);
        if (deleted == 0) {
            throw new IllegalArgumentException("tracked wallet was not found");
        }
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
        String normalizedAddress = address.trim().toLowerCase(Locale.ROOT);
        if (!ETHEREUM_ADDRESS_PATTERN.matcher(normalizedAddress).matches()) {
            throw new IllegalArgumentException("wallet address must be a 42-character Ethereum address");
        }
        return normalizedAddress;
    }

    private String normalizeLabel(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        return label.trim();
    }
}
