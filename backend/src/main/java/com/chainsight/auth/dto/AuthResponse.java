package com.chainsight.auth.dto;

public record AuthResponse(
        String tokenType,
        String accessToken,
        long expiresInSeconds,
        CurrentUserResponse user
) {
}
