package com.chainsight.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TrackedWalletRequest(
        @NotNull Long chainId,
        @NotBlank String walletAddress,
        @Size(max = 80) String label
) {
}
