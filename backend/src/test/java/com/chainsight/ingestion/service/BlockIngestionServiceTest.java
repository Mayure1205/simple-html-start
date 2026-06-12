package com.chainsight.ingestion.service;

import com.chainsight.ingestion.dto.IngestionJobResponse;
import com.chainsight.ingestion.dto.IngestionResult;
import com.chainsight.ingestion.dto.StartIngestionRequest;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import com.chainsight.ingestion.repository.BlockJdbcRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlockIngestionServiceTest {

    private static final long ETHEREUM_CHAIN_ID = 1L;
    private static final int MAX_RANGE_SIZE = 100;

    @Mock
    private EthereumRpcAdapter rpcAdapter;

    @Mock
    private BlockJdbcRepository repository;

    @Mock
    private TransactionTemplate transactionTemplate;

    private BlockIngestionService service;

    @BeforeEach
    void setUp() {
        service = new BlockIngestionService(
                rpcAdapter,
                repository,
                transactionTemplate,
                ETHEREUM_CHAIN_ID,
                MAX_RANGE_SIZE
        );
    }

    @Test
    void ingestBlockPersistsBlockTransactionsWalletsAndCheckpoint() {
        runTransactionsImmediately();

        BigInteger blockNumber = BigInteger.valueOf(22_000_001L);
        Instant blockTimestamp = Instant.parse("2026-06-12T09:00:00Z");
        BlockData blockData = block(blockNumber, blockTimestamp);

        when(rpcAdapter.fetchBlock(blockNumber)).thenReturn(blockData);
        when(repository.insertBlock(blockData, ETHEREUM_CHAIN_ID)).thenReturn(1);
        when(repository.insertTransactions(blockData.transactions(), ETHEREUM_CHAIN_ID, blockTimestamp)).thenReturn(2);

        IngestionResult result = service.ingestBlock(blockNumber);

        assertThat(result.blockNumber()).isEqualTo(blockNumber);
        assertThat(result.blocksInserted()).isEqualTo(1);
        assertThat(result.transactionsSeen()).isEqualTo(2);
        assertThat(result.transactionsInserted()).isEqualTo(2);
        assertThat(result.checkpointUpdated()).isTrue();
        assertThat(result.status()).isEqualTo("SUCCESS");

        verify(repository).upsertWallets(
                argThat(addresses -> containsExactlyWallets(addresses, "0xaaa", "0xbbb", "0xccc")),
                eq(ETHEREUM_CHAIN_ID),
                eq(blockTimestamp)
        );
        verify(repository).updateCheckpoint(ETHEREUM_CHAIN_ID, blockNumber);
    }

    @Test
    void ingestRangeCreatesJobAndMarksItCompleted() {
        runTransactionsImmediately();

        BigInteger startBlock = BigInteger.valueOf(22_000_001L);
        BigInteger endBlock = BigInteger.valueOf(22_000_002L);
        Instant firstTimestamp = Instant.parse("2026-06-12T09:00:00Z");
        Instant secondTimestamp = Instant.parse("2026-06-12T09:00:12Z");

        BlockData firstBlock = block(startBlock, firstTimestamp);
        BlockData secondBlock = block(endBlock, secondTimestamp);

        when(repository.createJob(ETHEREUM_CHAIN_ID, startBlock, endBlock)).thenReturn(42L);
        when(rpcAdapter.fetchBlock(startBlock)).thenReturn(firstBlock);
        when(rpcAdapter.fetchBlock(endBlock)).thenReturn(secondBlock);
        when(repository.insertBlock(any(BlockData.class), eq(ETHEREUM_CHAIN_ID))).thenReturn(1);
        when(repository.insertTransactions(any(), eq(ETHEREUM_CHAIN_ID), any())).thenReturn(2);

        IngestionJobResponse response = service.ingestRange(new StartIngestionRequest(
                ETHEREUM_CHAIN_ID,
                startBlock,
                endBlock
        ));

        assertThat(response.jobId()).isEqualTo(42L);
        assertThat(response.chainId()).isEqualTo(ETHEREUM_CHAIN_ID);
        assertThat(response.processedBlocks()).isEqualTo(2);
        assertThat(response.transactionsInserted()).isEqualTo(4);
        assertThat(response.status()).isEqualTo("COMPLETED");

        verify(repository).markJobCompleted(42L);
    }

    @Test
    void ingestRangeRejectsUnsupportedChain() {
        StartIngestionRequest request = new StartIngestionRequest(
                137L,
                BigInteger.ONE,
                BigInteger.TEN
        );

        assertThatThrownBy(() -> service.ingestRange(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only Ethereum chainId 1 is supported in MVP");

        verifyNoInteractions(rpcAdapter, repository);
    }

    @Test
    void ingestRangeRejectsRangesAboveConfiguredLimit() {
        StartIngestionRequest request = new StartIngestionRequest(
                ETHEREUM_CHAIN_ID,
                BigInteger.ONE,
                BigInteger.valueOf(101)
        );

        assertThatThrownBy(() -> service.ingestRange(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Block range must be 100 blocks or fewer");

        verifyNoInteractions(rpcAdapter, repository);
    }

    private BlockData block(BigInteger blockNumber, Instant blockTimestamp) {
        return new BlockData(
                blockNumber,
                "0xblock" + blockNumber,
                blockTimestamp,
                BigInteger.valueOf(1_000_000_000L),
                30_000_000L,
                BigInteger.valueOf(30_000_000L),
                List.of(
                        transaction(blockNumber, "0xhash1", "0xaaa", "0xbbb"),
                        transaction(blockNumber, "0xhash2", "0xbbb", "0xccc")
                )
        );
    }

    private TransactionData transaction(BigInteger blockNumber, String hash, String from, String to) {
        return new TransactionData(
                blockNumber,
                hash,
                from,
                to,
                BigInteger.valueOf(1_000_000_000_000_000_000L),
                BigInteger.valueOf(10_000_000_000L),
                null,
                null
        );
    }

    private void runTransactionsImmediately() {
        when(transactionTemplate.execute(any())).thenAnswer(invocation -> invocation
                .<org.springframework.transaction.support.TransactionCallback<IngestionResult>>getArgument(0)
                .doInTransaction(null));
    }

    private boolean containsExactlyWallets(Set<String> addresses, String... expectedAddresses) {
        return addresses.containsAll(Set.of(expectedAddresses)) && addresses.size() == expectedAddresses.length;
    }
}
