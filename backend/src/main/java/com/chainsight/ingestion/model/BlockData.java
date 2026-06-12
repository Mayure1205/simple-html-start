package com.chainsight.ingestion.model;

import lombok.Builder;
import lombok.Data;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class BlockData {
    private BigInteger blockNumber;
    private String blockHash;
    private Instant blockTimestamp;
    private BigInteger baseFeePerGasWei;
    private Long gasUsed;
    private BigInteger gasLimit;
    
    private List<TransactionData> transactions;
}
