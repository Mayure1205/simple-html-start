package com.chainsight.auth.model;

public record AuthenticatedUserPrincipal(
        long userId,
        String email
) {
}
