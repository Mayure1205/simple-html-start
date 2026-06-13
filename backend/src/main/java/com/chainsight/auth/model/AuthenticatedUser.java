package com.chainsight.auth.model;

import java.time.Instant;

public record AuthenticatedUser(
        long id,
        String email,
        String passwordHash,
        String walletAddress,
        Instant createdAt
) {
}
