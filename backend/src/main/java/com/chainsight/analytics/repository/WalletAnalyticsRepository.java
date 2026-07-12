package com.chainsight.analytics.repository;

import com.chainsight.analytics.dto.WalletSummaryResponse;
import com.chainsight.analytics.dto.WalletTransactionResponse;
import com.chainsight.analytics.dto.WalletDailyFlowPoint;
import com.chainsight.analytics.dto.WalletCounterpartyPoint;
import java.time.Instant;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class WalletAnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public WalletAnalyticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<WalletTransactionResponse> findTransactions(long chainId, String address, int page, int size) {
        String sql = """
                SELECT
                    transaction_hash,
                    block_number,
                    from_address,
                    to_address,
                    value_wei,
                    gas_price_wei,
                    gas_used,
                    status,
                    block_timestamp,
                    CASE WHEN from_address = ? THEN 'SENT' ELSE 'RECEIVED' END AS direction,
                    CASE WHEN from_address = ? THEN to_address ELSE from_address END AS counterparty_address
                FROM transactions
                WHERE chain_id = ?
                  AND (from_address = ? OR to_address = ?)
                ORDER BY block_timestamp DESC, block_number DESC, transaction_hash ASC
                LIMIT ? OFFSET ?
                """;

        int offset = page * size;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapWalletTransaction(rs),
                address,
                address,
                chainId,
                address,
                address,
                size,
                offset
        );
    }

    public long countTransactions(long chainId, String address) {
        Long count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM transactions
                WHERE chain_id = ?
                  AND (from_address = ? OR to_address = ?)
                """,
                Long.class,
                chainId,
                address,
                address
        );
        return count == null ? 0 : count;
    }

    public WalletSummaryResponse summarizeWallet(long chainId, String address) {
        String sql = """
                SELECT
                    COALESCE(SUM(CASE WHEN from_address = ? THEN 1 ELSE 0 END), 0) AS sent_count,
                    COALESCE(SUM(CASE WHEN to_address = ? THEN 1 ELSE 0 END), 0) AS received_count,
                    COALESCE(SUM(CASE WHEN from_address = ? THEN value_wei ELSE 0 END), 0) AS sent_value_wei,
                    COALESCE(SUM(CASE WHEN to_address = ? THEN value_wei ELSE 0 END), 0) AS received_value_wei,
                    MIN(block_timestamp) AS first_activity_at,
                    MAX(block_timestamp) AS last_activity_at
                FROM transactions
                WHERE chain_id = ?
                  AND (from_address = ? OR to_address = ?)
                """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> mapWalletSummary(rs, chainId, address),
                address,
                address,
                address,
                address,
                chainId,
                address,
                address
        );
    }

    private WalletTransactionResponse mapWalletTransaction(ResultSet rs) throws java.sql.SQLException {
        return new WalletTransactionResponse(
                rs.getString("transaction_hash"),
                rs.getLong("block_number"),
                rs.getString("direction"),
                rs.getString("counterparty_address"),
                rs.getString("from_address"),
                rs.getString("to_address"),
                toPlainString(rs.getBigDecimal("value_wei")),
                toPlainString(rs.getBigDecimal("gas_price_wei")),
                getNullableLong(rs, "gas_used"),
                getNullableInteger(rs, "status"),
                rs.getTimestamp("block_timestamp").toInstant()
        );
    }

    private WalletSummaryResponse mapWalletSummary(ResultSet rs, long chainId, String address) throws java.sql.SQLException {
        BigDecimal sentValue = rs.getBigDecimal("sent_value_wei");
        BigDecimal receivedValue = rs.getBigDecimal("received_value_wei");
        BigDecimal netFlow = receivedValue.subtract(sentValue);

        Timestamp firstActivityAt = rs.getTimestamp("first_activity_at");
        Timestamp lastActivityAt = rs.getTimestamp("last_activity_at");

        return new WalletSummaryResponse(
                chainId,
                address,
                rs.getLong("sent_count"),
                rs.getLong("received_count"),
                toPlainString(sentValue),
                toPlainString(receivedValue),
                toPlainString(netFlow),
                firstActivityAt == null ? null : firstActivityAt.toInstant(),
                lastActivityAt == null ? null : lastActivityAt.toInstant()
        );
    }

    private String toPlainString(BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }

    private Long getNullableLong(ResultSet rs, String columnName) throws java.sql.SQLException {
        long value = rs.getLong(columnName);
        return rs.wasNull() ? null : value;
    }

    private Integer getNullableInteger(ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }

    public List<WalletDailyFlowPoint> findDailyFlow(long chainId, String address, int days) {
        Timestamp latestTs = jdbcTemplate.queryForObject(
                "SELECT MAX(block_timestamp) FROM transactions WHERE chain_id = ?",
                Timestamp.class,
                chainId
        );
        
        Instant toInstant = Instant.now();
        if (latestTs != null && latestTs.toInstant().isBefore(toInstant.minus(java.time.Duration.ofDays(days)))) {
            toInstant = latestTs.toInstant().plus(java.time.Duration.ofDays(1));
        }
        Instant fromInstant = toInstant.minus(java.time.Duration.ofDays(days));
        
        String sql = """
                SELECT
                    block_timestamp::date AS day,
                    COALESCE(SUM(CASE WHEN to_address = ? THEN value_wei ELSE 0 END), 0) AS inflow_wei,
                    COALESCE(SUM(CASE WHEN from_address = ? THEN value_wei ELSE 0 END), 0) AS outflow_wei,
                    COUNT(*) AS tx_count
                FROM transactions
                WHERE chain_id = ?
                  AND (from_address = ? OR to_address = ?)
                  AND block_timestamp >= ?
                  AND block_timestamp <= ?
                GROUP BY block_timestamp::date
                ORDER BY day ASC
                """;
                
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {
                    BigDecimal inflow = rs.getBigDecimal("inflow_wei");
                    BigDecimal outflow = rs.getBigDecimal("outflow_wei");
                    BigDecimal net = inflow.subtract(outflow);
                    return new WalletDailyFlowPoint(
                            rs.getDate("day").toString(),
                            inflow.toPlainString(),
                            outflow.toPlainString(),
                            net.toPlainString(),
                            rs.getLong("tx_count")
                    );
                },
                address,
                address,
                chainId,
                address,
                address,
                Timestamp.from(fromInstant),
                Timestamp.from(toInstant)
        );
    }

    public List<WalletCounterpartyPoint> findCounterparties(long chainId, String address, int limit) {
        String sql = """
                WITH cp AS (
                    SELECT
                        CASE WHEN from_address = ? THEN to_address ELSE from_address END AS cp_address,
                        CASE WHEN from_address = ? THEN value_wei ELSE 0 END AS sent_val,
                        CASE WHEN to_address = ? THEN value_wei ELSE 0 END AS recv_val,
                        CASE WHEN from_address = ? THEN 1 ELSE 0 END AS sent_cnt,
                        CASE WHEN to_address = ? THEN 1 ELSE 0 END AS recv_cnt
                    FROM transactions
                    WHERE chain_id = ?
                      AND (from_address = ? OR to_address = ?)
                )
                SELECT
                    cp_address,
                    COALESCE(SUM(sent_val), 0) AS sent_wei,
                    COALESCE(SUM(recv_val), 0) AS received_wei,
                    COALESCE(SUM(sent_cnt), 0) AS sent_to_count,
                    COALESCE(SUM(recv_cnt), 0) AS received_from_count
                FROM cp
                WHERE cp_address IS NOT NULL AND cp_address != ?
                GROUP BY cp_address
                ORDER BY (COALESCE(SUM(sent_cnt), 0) + COALESCE(SUM(recv_cnt), 0)) DESC, cp_address ASC
                LIMIT ?
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new WalletCounterpartyPoint(
                        rs.getString("cp_address"),
                        rs.getBigDecimal("sent_wei").toPlainString(),
                        rs.getBigDecimal("received_wei").toPlainString(),
                        rs.getLong("sent_to_count"),
                        rs.getLong("received_from_count")
                ),
                address,
                address,
                address,
                address,
                address,
                chainId,
                address,
                address,
                address,
                limit
        );
    }
}
