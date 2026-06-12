package com.chainsight.ingestion.service;

import com.chainsight.exception.RpcFetchException;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.methods.response.EthBlock;
import org.web3j.protocol.core.methods.response.Transaction;

import java.io.IOException;
import java.math.BigInteger;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class EthereumRpcAdapter {

    private static final Logger logger = LoggerFactory.getLogger(EthereumRpcAdapter.class);
    private final Web3j web3j;

    public EthereumRpcAdapter(Web3j web3j) {
        this.web3j = web3j;
    }

    public BlockData fetchBlock(BigInteger blockNumber) {
        try {
            logger.info("Fetching block {}", blockNumber);
            // Fetch block by number with full transaction objects (true)
            EthBlock.Block ethBlock = web3j.ethGetBlockByNumber(
                    DefaultBlockParameter.valueOf(blockNumber), true)
                    .send()
                    .getBlock();

            if (ethBlock == null) {
                throw new RpcFetchException("Block " + blockNumber + " not found on RPC", null);
            }

            return mapToBlockData(ethBlock);

        } catch (IOException e) {
            throw new RpcFetchException("Failed to fetch block " + blockNumber + " from RPC provider", e);
        }
    }

    private BlockData mapToBlockData(EthBlock.Block ethBlock) {
        // Map transactions
        List<TransactionData> transactions = ethBlock.getTransactions().stream()
                .map(txResult -> (EthBlock.TransactionObject) txResult)
                .map(this::mapToTransactionData)
                .collect(Collectors.toList());

        // Extract baseFeePerGas if EIP-1559 block
        BigInteger baseFee = null;
        if (ethBlock.getBaseFeePerGas() != null && !ethBlock.getBaseFeePerGas().isEmpty()) {
            baseFee = new BigInteger(ethBlock.getBaseFeePerGas().replace("0x", ""), 16);
        }

        return BlockData.builder()
                .blockNumber(ethBlock.getNumber())
                .blockHash(ethBlock.getHash())
                .blockTimestamp(Instant.ofEpochSecond(ethBlock.getTimestamp().longValue()))
                .baseFeePerGasWei(baseFee)
                .gasUsed(ethBlock.getGasUsed().longValue())
                .gasLimit(ethBlock.getGasLimit())
                .transactions(transactions)
                .build();
    }

    private TransactionData mapToTransactionData(EthBlock.TransactionObject tx) {
        return TransactionData.builder()
                .blockNumber(tx.getBlockNumber())
                .transactionHash(tx.getHash())
                .fromAddress(tx.getFrom())
                .toAddress(tx.getTo()) // Can be null for contract creation
                .valueWei(tx.getValue())
                .gasPriceWei(tx.getGasPrice())
                // gasLimit in transaction is tx.getGas()
                .build();
    }
}
