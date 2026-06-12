package com.chainsight.ingestion.model;

import lombok.Builder;
import lombok.Data;

import java.math.BigInteger;

@Data
@Builder
public class TransactionData {
    private BigInteger blockNumber;
    private String transactionHash;
    private String fromAddress;
    private String toAddress;
    private BigInteger valueWei;
    private BigInteger gasPriceWei;
    // Note: To get actual gasUsed and status (success/failure) we would normally need the TransactionReceipt.
    // For Sprint 1, we only have what is in the block's transaction object. 
    // Usually, status and gasUsed come from receipts, but the requirements just say "transform native transactions".
    // We will leave status and gasUsed null for now unless fetched.
    private Long gasUsed;
    private Integer status; 
}
