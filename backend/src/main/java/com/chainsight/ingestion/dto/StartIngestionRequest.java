package com.chainsight.ingestion.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigInteger;

public record StartIngestionRequest(
        @NotNull Long chainId,
        @NotNull BigInteger startBlock,
        @NotNull BigInteger endBlock
) {
}
