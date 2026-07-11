package com.chainsight.auth.dto;

public record NonceResponse(
        String nonce,
        String message
) {
}
