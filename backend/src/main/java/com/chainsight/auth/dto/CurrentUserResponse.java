package com.chainsight.auth.dto;

import java.time.Instant;

public record CurrentUserResponse(
        long id,
        String email,
        String walletAddress,
        Instant createdAt
) {
}
