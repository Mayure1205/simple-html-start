package com.chainsight.ingestion.service;

import com.chainsight.exception.RpcFetchException;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.methods.response.EthBlock;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import java.io.IOException;
import java.math.BigInteger;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;

@Service
public class EthereumRpcAdapter {

    private static final Logger logger = LoggerFactory.getLogger(EthereumRpcAdapter.class);
    private final Web3j web3j;
    private final CircuitBreaker ethereumRpcCircuitBreaker;
    private final Executor receiptFetchExecutor;

    public EthereumRpcAdapter(
            Web3j web3j,
            CircuitBreakerRegistry circuitBreakerRegistry,
            @Qualifier("receiptFetchExecutor") Executor receiptFetchExecutor
    ) {
        this.web3j = web3j;
        this.ethereumRpcCircuitBreaker = circuitBreakerRegistry.circuitBreaker("ethereumRpc");
        this.receiptFetchExecutor = receiptFetchExecutor;
    }

    public BlockData fetchBlock(BigInteger blockNumber) {
        return ethereumRpcCircuitBreaker.executeSupplier(() -> fetchBlockFromRpc(blockNumber));
    }

    private BlockData fetchBlockFromRpc(BigInteger blockNumber) {
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
        List<EthBlock.TransactionObject> transactionObjects = ethBlock.getTransactions().stream()
                .map(txResult -> (EthBlock.TransactionObject) txResult)
                .toList();

        // Fetch receipts concurrently on the dedicated receipt pool instead of
        // one-by-one: a 200-tx block goes from 200 sequential RPC round trips
        // to bounded parallel fetches. The receipt pool is separate from the
        // block extraction pool to avoid nested-task starvation.
        List<CompletableFuture<TransactionData>> futures = transactionObjects.stream()
                .map(tx -> CompletableFuture.supplyAsync(() -> mapToTransactionData(tx), receiptFetchExecutor))
                .toList();

        List<TransactionData> transactions;
        try {
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            transactions = futures.stream().map(CompletableFuture::join).toList();
        } catch (CompletionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RpcFetchException rpcFetchException) {
                throw rpcFetchException;
            }
            throw new RpcFetchException(
                    "Failed to fetch transaction receipts for block " + ethBlock.getNumber(), cause);
        }

        return new BlockData(
                ethBlock.getNumber(),
                ethBlock.getHash(),
                Instant.ofEpochSecond(ethBlock.getTimestamp().longValueExact()),
                ethBlock.getBaseFeePerGas(),
                ethBlock.getGasUsed().longValueExact(),
                ethBlock.getGasLimit(),
                transactions
        );
    }

    private TransactionData mapToTransactionData(EthBlock.TransactionObject tx) {
        Optional<TransactionReceipt> receipt = fetchTransactionReceipt(tx.getHash());
        return new TransactionData(
                tx.getBlockNumber(),
                tx.getHash(),
                normalizeAddress(tx.getFrom()),
                normalizeAddress(tx.getTo()),
                tx.getValue(),
                tx.getGasPrice(),
                receipt.map(TransactionReceipt::getGasUsed)
                        .map(BigInteger::longValueExact)
                        .orElse(null),
                receipt.map(this::mapReceiptStatus).orElse(null)
        );
    }

    private Optional<TransactionReceipt> fetchTransactionReceipt(String transactionHash) {
        return ethereumRpcCircuitBreaker.executeSupplier(() -> fetchTransactionReceiptFromRpc(transactionHash));
    }

    private Optional<TransactionReceipt> fetchTransactionReceiptFromRpc(String transactionHash) {
        try {
            return web3j.ethGetTransactionReceipt(transactionHash)
                    .send()
                    .getTransactionReceipt();
        } catch (IOException e) {
            throw new RpcFetchException("Failed to fetch receipt for transaction " + transactionHash, e);
        }
    }

    private Integer mapReceiptStatus(TransactionReceipt receipt) {
        if (receipt.getStatus() == null) {
            return null;
        }
        return receipt.isStatusOK() ? 1 : 0;
    }

    private String normalizeAddress(String address) {
        return address == null ? null : address.toLowerCase();
    }
}
