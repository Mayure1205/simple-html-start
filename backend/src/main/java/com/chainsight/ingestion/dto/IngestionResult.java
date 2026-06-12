package com.chainsight.ingestion.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigInteger;

@Data
@Builder
public class IngestionResult {
    private BigInteger blockNumber;
    private int transactionsInserted;
    private boolean checkpointUpdated;
    private String status;
}
