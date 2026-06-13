package com.chainsight.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record WalletLoginRequest(
        @NotBlank String walletAddress,
        @NotBlank String signature
) {
}
