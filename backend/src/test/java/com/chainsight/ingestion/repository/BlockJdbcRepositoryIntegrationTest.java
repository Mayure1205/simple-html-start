package com.chainsight.ingestion.repository;

import com.chainsight.ingestion.dto.IngestionJobResponse;
import com.chainsight.ingestion.dto.StartIngestionRequest;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import com.chainsight.ingestion.service.BlockIngestionService;
import com.chainsight.ingestion.service.EthereumRpcAdapter;
import com.chainsight.resilience.RedisIngestionLockService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@Testcontainers(disabledWithoutDocker = true)
class BlockJdbcRepositoryIntegrationTest {

    private static final long ETHEREUM_CHAIN_ID = 1L;

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("chainsight")
            .withUsername("chainsight_user")
            .withPassword("chainsight_password");

    private JdbcTemplate jdbcTemplate;
    private BlockJdbcRepository repository;
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                POSTGRES.getJdbcUrl(),
                POSTGRES.getUsername(),
                POSTGRES.getPassword()
        );

        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load();
        flyway.clean();
        flyway.migrate();

        jdbcTemplate = new JdbcTemplate(dataSource);
        repository = new BlockJdbcRepository(jdbcTemplate);
        transactionTemplate = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
    }

    @Test
    void replayingCommittedBlockDoesNotCreateDuplicateRows() {
        BlockData block = block(BigInteger.valueOf(19_999_500L));

        transactionTemplate.executeWithoutResult(status -> persistBlock(block));
        transactionTemplate.executeWithoutResult(status -> persistBlock(block));

        assertThat(countRows("blocks")).isEqualTo(1);
        assertThat(countRows("transactions")).isEqualTo(2);
        assertThat(countRows("wallets")).isEqualTo(3);
        assertThat(repository.getLastProcessedBlock(ETHEREUM_CHAIN_ID)).isEqualTo(19_999_500L);
    }

    @Test
    void transactionRollbackRemovesPartialBlockWhenCrashHappensBeforeCheckpoint() {
        BlockData block = block(BigInteger.valueOf(19_999_501L));

        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(status -> {
            repository.insertBlock(block, ETHEREUM_CHAIN_ID);
            repository.insertTransactions(block.transactions(), ETHEREUM_CHAIN_ID, block.blockTimestamp());
            repository.upsertWallets(wallets(block), ETHEREUM_CHAIN_ID, block.blockTimestamp());
            throw new IllegalStateException("simulated crash before checkpoint");
        }))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("simulated crash before checkpoint");

        assertThat(countRows("blocks")).isZero();
        assertThat(countRows("transactions")).isZero();
        assertThat(countRows("wallets")).isZero();
        assertThat(repository.getLastProcessedBlock(ETHEREUM_CHAIN_ID)).isZero();
    }

    @Test
    void rangeIngestionSkipsAlreadyCheckpointedBlocksOnRestart() {
        EthereumRpcAdapter rpcAdapter = mock(EthereumRpcAdapter.class);
        RedisIngestionLockService ingestionLockService = mock(RedisIngestionLockService.class);
        BlockIngestionService service = new BlockIngestionService(
                rpcAdapter,
                repository,
                transactionTemplate,
                Runnable::run,
                ingestionLockService,
                ETHEREUM_CHAIN_ID,
                100
        );

        BigInteger startBlock = BigInteger.valueOf(19_999_000L);
        BigInteger middleBlock = BigInteger.valueOf(19_999_001L);
        BigInteger endBlock = BigInteger.valueOf(19_999_002L);

        when(rpcAdapter.fetchBlock(startBlock)).thenReturn(block(startBlock));
        when(rpcAdapter.fetchBlock(middleBlock)).thenReturn(block(middleBlock));
        when(rpcAdapter.fetchBlock(endBlock)).thenReturn(block(endBlock));
        when(ingestionLockService.acquireRangeLock(ETHEREUM_CHAIN_ID, startBlock, endBlock))
                .thenReturn("lock-token");

        StartIngestionRequest request = new StartIngestionRequest(ETHEREUM_CHAIN_ID, startBlock, endBlock);
        IngestionJobResponse firstRun = service.ingestRange(request);

        assertThat(firstRun.processedBlocks()).isEqualTo(3);
        assertThat(firstRun.skippedBlocks()).isZero();
        assertThat(repository.getLastProcessedBlock(ETHEREUM_CHAIN_ID)).isEqualTo(endBlock.longValueExact());
        assertThat(countRows("blocks")).isEqualTo(3);
        assertThat(countRows("transactions")).isEqualTo(6);

        verify(rpcAdapter).fetchBlock(startBlock);
        verify(rpcAdapter).fetchBlock(middleBlock);
        verify(rpcAdapter).fetchBlock(endBlock);
        clearInvocations(rpcAdapter);

        IngestionJobResponse restartRun = service.ingestRange(request);

        assertThat(restartRun.resumeFromBlock()).isEqualTo(endBlock.add(BigInteger.ONE));
        assertThat(restartRun.skippedBlocks()).isEqualTo(3);
        assertThat(restartRun.processedBlocks()).isZero();
        assertThat(restartRun.transactionsInserted()).isZero();
        assertThat(countRows("blocks")).isEqualTo(3);
        assertThat(countRows("transactions")).isEqualTo(6);
        verifyNoInteractions(rpcAdapter);
    }

    private void persistBlock(BlockData block) {
        repository.insertBlock(block, ETHEREUM_CHAIN_ID);
        repository.insertTransactions(block.transactions(), ETHEREUM_CHAIN_ID, block.blockTimestamp());
        repository.upsertWallets(wallets(block), ETHEREUM_CHAIN_ID, block.blockTimestamp());
        repository.updateCheckpoint(ETHEREUM_CHAIN_ID, block.blockNumber());
    }

    private Set<String> wallets(BlockData block) {
        return block.transactions().stream()
                .flatMap(transaction -> Stream.of(transaction.fromAddress(), transaction.toAddress()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private BlockData block(BigInteger blockNumber) {
        return new BlockData(
                blockNumber,
                "0xblock" + blockNumber,
                Instant.parse("2026-06-12T09:00:00Z").plusSeconds(blockNumber.longValueExact() % 60),
                BigInteger.valueOf(1_000_000_000L),
                30_000_000L,
                BigInteger.valueOf(30_000_000L),
                List.of(
                        transaction(blockNumber, "0xtx" + blockNumber + "01", "0xaaa", "0xbbb"),
                        transaction(blockNumber, "0xtx" + blockNumber + "02", "0xbbb", "0xccc")
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

    private long countRows(String tableName) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
        return count == null ? 0 : count;
    }
}
