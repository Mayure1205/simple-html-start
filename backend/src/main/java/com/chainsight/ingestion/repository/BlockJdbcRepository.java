package com.chainsight.ingestion.repository;

import com.chainsight.ingestion.dto.FailedBlockResponse;
import com.chainsight.ingestion.dto.IngestionJobStatusResponse;
import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Repository
public class BlockJdbcRepository {

    private final JdbcTemplate jdbcTemplate;

    public BlockJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long createJob(long chainId, BigInteger startBlock, BigInteger endBlock) {
        String sql = "INSERT INTO ingestion_jobs (chain_id, start_block, end_block, status) " +
                     "VALUES (?, ?, ?, 'RUNNING')";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, chainId);
            ps.setLong(2, toLong(startBlock));
            ps.setLong(3, toLong(endBlock));
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        Number key = keys == null ? keyHolder.getKey() : (Number) keys.get("id");
        if (key == null) {
            throw new IllegalStateException("Database did not return an ingestion job id");
        }
        return key.longValue();
    }

    public void markJobCompleted(long jobId) {
        String sql = "UPDATE ingestion_jobs " +
                     "SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP " +
                     "WHERE id = ?";
        jdbcTemplate.update(sql, jobId);
    }

    public void markJobFailed(long jobId, String failureReason) {
        String sql = "UPDATE ingestion_jobs " +
                     "SET status = 'FAILED', completed_at = CURRENT_TIMESTAMP, failure_reason = ? " +
                     "WHERE id = ?";
        jdbcTemplate.update(sql, failureReason, jobId);
    }

    public int markStaleActiveJobsFailed(Instant startedBefore, String failureReason) {
        String sql = "UPDATE ingestion_jobs " +
                     "SET status = 'FAILED', completed_at = CURRENT_TIMESTAMP, failure_reason = ? " +
                     "WHERE status IN ('PENDING', 'RUNNING') " +
                     "AND started_at < ?";
        return jdbcTemplate.update(sql, trimFailureReason(failureReason), Timestamp.from(startedBefore));
    }

    public void recordFailedBlock(long chainId, BigInteger blockNumber, String failureReason) {
        String sql = "INSERT INTO failed_blocks (chain_id, block_number, failure_reason, status) " +
                     "VALUES (?, ?, ?, 'PENDING') " +
                     "ON CONFLICT (chain_id, block_number) DO UPDATE SET " +
                     "failure_reason = EXCLUDED.failure_reason, " +
                     "status = 'PENDING', " +
                     "updated_at = CURRENT_TIMESTAMP";

        jdbcTemplate.update(sql, chainId, toLong(blockNumber), trimFailureReason(failureReason));
    }

    public void markFailedBlockRetrying(long chainId, BigInteger blockNumber) {
        String sql = "UPDATE failed_blocks " +
                     "SET status = 'RETRYING', retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP " +
                     "WHERE chain_id = ? AND block_number = ?";

        int updatedRows = jdbcTemplate.update(sql, chainId, toLong(blockNumber));
        if (updatedRows == 0) {
            recordFailedBlock(chainId, blockNumber, "Manual retry requested");
            jdbcTemplate.update(sql, chainId, toLong(blockNumber));
        }
    }

    public void markFailedBlockSuccess(long chainId, BigInteger blockNumber) {
        String sql = "UPDATE failed_blocks " +
                     "SET status = 'SUCCESS', updated_at = CURRENT_TIMESTAMP " +
                     "WHERE chain_id = ? AND block_number = ?";

        jdbcTemplate.update(sql, chainId, toLong(blockNumber));
    }

    public List<FailedBlockResponse> findFailedBlocks(long chainId, String status) {
        String baseSql = "SELECT chain_id, block_number, failure_reason, retry_count, status, created_at, updated_at " +
                         "FROM failed_blocks WHERE chain_id = ?";
        if (status == null || status.isBlank()) {
            return jdbcTemplate.query(
                    baseSql + " ORDER BY block_number ASC",
                    (rs, rowNum) -> new FailedBlockResponse(
                            rs.getLong("chain_id"),
                            BigInteger.valueOf(rs.getLong("block_number")),
                            rs.getString("failure_reason"),
                            rs.getInt("retry_count"),
                            rs.getString("status"),
                            rs.getTimestamp("created_at").toInstant(),
                            rs.getTimestamp("updated_at").toInstant()
                    ),
                    chainId
            );
        }

        return jdbcTemplate.query(
                baseSql + " AND status = ? ORDER BY block_number ASC",
                (rs, rowNum) -> new FailedBlockResponse(
                        rs.getLong("chain_id"),
                        BigInteger.valueOf(rs.getLong("block_number")),
                        rs.getString("failure_reason"),
                        rs.getInt("retry_count"),
                        rs.getString("status"),
                        rs.getTimestamp("created_at").toInstant(),
                        rs.getTimestamp("updated_at").toInstant()
                ),
                chainId,
                status
        );
    }

    public IngestionJobStatusResponse findJobById(long jobId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, chain_id, start_block, end_block, status, started_at, completed_at, failure_reason " +
                    "FROM ingestion_jobs WHERE id = ?",
                    (rs, rowNum) -> new IngestionJobStatusResponse(
                            rs.getLong("id"),
                            rs.getLong("chain_id"),
                            BigInteger.valueOf(rs.getLong("start_block")),
                            BigInteger.valueOf(rs.getLong("end_block")),
                            rs.getString("status"),
                            rs.getTimestamp("started_at").toInstant(),
                            rs.getTimestamp("completed_at") == null
                                    ? null
                                    : rs.getTimestamp("completed_at").toInstant(),
                            rs.getString("failure_reason")
                    ),
                    jobId
            );
        } catch (EmptyResultDataAccessException ex) {
            throw new IllegalArgumentException("Ingestion job " + jobId + " was not found");
        }
    }

    public int insertBlock(BlockData block, long chainId) {
        String sql = "INSERT INTO blocks (chain_id, block_number, block_hash, block_timestamp, base_fee_per_gas_wei, gas_used, gas_limit) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                     "ON CONFLICT (chain_id, block_number) DO NOTHING";

        return jdbcTemplate.update(sql,
                chainId,
                toLong(block.blockNumber()),
                block.blockHash(),
                Timestamp.from(block.blockTimestamp()),
                toBigDecimal(block.baseFeePerGasWei()),
                block.gasUsed(),
                toLong(block.gasLimit()));
    }

    public int insertTransactions(List<TransactionData> transactions, long chainId, Instant blockTimestamp) {
        if (transactions.isEmpty()) {
            return 0;
        }

        String sql = "INSERT INTO transactions (chain_id, block_number, transaction_hash, from_address, to_address, value_wei, gas_price_wei, gas_used, status, block_timestamp) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON CONFLICT (chain_id, transaction_hash) DO NOTHING";

        int[][] updateCounts = jdbcTemplate.batchUpdate(sql, transactions, 500, (PreparedStatement ps, TransactionData tx) -> {
            ps.setLong(1, chainId);
            ps.setLong(2, toLong(tx.blockNumber()));
            ps.setString(3, tx.transactionHash());
            ps.setString(4, tx.fromAddress());
            ps.setString(5, tx.toAddress());
            ps.setBigDecimal(6, toBigDecimal(tx.valueWei(), BigDecimal.ZERO));
            setNullableBigDecimal(ps, 7, tx.gasPriceWei());
            setNullableLong(ps, 8, tx.gasUsed());
            setNullableInteger(ps, 9, tx.status());
            ps.setTimestamp(10, Timestamp.from(blockTimestamp));
        });

        return countInsertedRows(updateCounts);
    }

    public void upsertWallets(Set<String> walletAddresses, long chainId, Instant seenAt) {
        if (walletAddresses.isEmpty()) {
            return;
        }

        String sql = "INSERT INTO wallets (chain_id, address, first_seen_at, last_seen_at) " +
                     "VALUES (?, ?, ?, ?) " +
                     "ON CONFLICT (chain_id, address) DO UPDATE SET " +
                     "first_seen_at = LEAST(wallets.first_seen_at, EXCLUDED.first_seen_at), " +
                     "last_seen_at = GREATEST(wallets.last_seen_at, EXCLUDED.last_seen_at)";

        jdbcTemplate.batchUpdate(sql, walletAddresses.stream().toList(), 500, (PreparedStatement ps, String address) -> {
            Timestamp timestamp = Timestamp.from(seenAt);
            ps.setLong(1, chainId);
            ps.setString(2, address);
            ps.setTimestamp(3, timestamp);
            ps.setTimestamp(4, timestamp);
        });
    }

    public void updateCheckpoint(long chainId, BigInteger blockNumber) {
        String sql = "INSERT INTO ingestion_checkpoints (chain_id, last_processed_block, updated_at) " +
                     "VALUES (?, ?, CURRENT_TIMESTAMP) " +
                     "ON CONFLICT (chain_id) DO UPDATE SET " +
                     "last_processed_block = GREATEST(ingestion_checkpoints.last_processed_block, EXCLUDED.last_processed_block), " +
                     "updated_at = CURRENT_TIMESTAMP";

        jdbcTemplate.update(sql, chainId, toLong(blockNumber));
    }

    public long countBlocks(long chainId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM blocks WHERE chain_id = ?",
                Long.class,
                chainId);
        return count == null ? 0 : count;
    }

    public long countTransactions(long chainId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE chain_id = ?",
                Long.class,
                chainId);
        return count == null ? 0 : count;
    }

    public long countFailedBlocks(long chainId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM failed_blocks WHERE chain_id = ? AND status IN ('PENDING', 'RETRYING')",
                Long.class,
                chainId);
        return count == null ? 0 : count;
    }

    public long countActiveJobs(long chainId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ingestion_jobs WHERE chain_id = ? AND status IN ('PENDING', 'RUNNING')",
                Long.class,
                chainId);
        return count == null ? 0 : count;
    }

    public long getLastProcessedBlock(long chainId) {
        try {
            Long checkpoint = jdbcTemplate.queryForObject(
                    "SELECT last_processed_block FROM ingestion_checkpoints WHERE chain_id = ?",
                    Long.class,
                    chainId);
            return checkpoint == null ? 0 : checkpoint;
        } catch (EmptyResultDataAccessException ex) {
            return 0;
        }
    }

    private BigDecimal toBigDecimal(BigInteger value) {
        return value == null ? null : new BigDecimal(value);
    }

    private BigDecimal toBigDecimal(BigInteger value, BigDecimal fallback) {
        return value == null ? fallback : new BigDecimal(value);
    }

    private long toLong(BigInteger value) {
        return value.longValueExact();
    }

    private void setNullableBigDecimal(PreparedStatement ps, int index, BigInteger value) throws java.sql.SQLException {
        if (value == null) {
            ps.setNull(index, Types.NUMERIC);
            return;
        }
        ps.setBigDecimal(index, new BigDecimal(value));
    }

    private void setNullableLong(PreparedStatement ps, int index, Long value) throws java.sql.SQLException {
        if (value == null) {
            ps.setNull(index, Types.BIGINT);
            return;
        }
        ps.setLong(index, value);
    }

    private void setNullableInteger(PreparedStatement ps, int index, Integer value) throws java.sql.SQLException {
        if (value == null) {
            ps.setNull(index, Types.SMALLINT);
            return;
        }
        ps.setInt(index, value);
    }

    private int countInsertedRows(int[][] updateCounts) {
        int insertedRows = 0;
        for (int[] batch : updateCounts) {
            for (int count : batch) {
                if (count > 0 || count == Statement.SUCCESS_NO_INFO) {
                    insertedRows++;
                }
            }
        }
        return insertedRows;
    }

    private String trimFailureReason(String failureReason) {
        if (failureReason == null || failureReason.isBlank()) {
            return "Unknown ingestion failure";
        }
        return failureReason.length() <= 1000 ? failureReason : failureReason.substring(0, 1000);
    }
}
