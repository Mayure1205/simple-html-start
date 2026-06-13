package com.chainsight.wallet.dto;

import java.time.Instant;

public record TrackedWalletResponse(
        long id,
        long chainId,
        String walletAddress,
        String label,
        Instant createdAt
) {
}
