package com.chainsight.analytics.repository;

import com.chainsight.analytics.dto.DailyNetworkMetricResponse;
import com.chainsight.analytics.dto.LargestTransactionResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Repository
public class NetworkAnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public NetworkAnalyticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DailyNetworkMetricResponse> findDailyMetrics(long chainId, LocalDate from, LocalDate to) {
        String sql = """
                WITH daily AS (
                    SELECT
                        b.block_timestamp::date AS metric_date,
                        COUNT(DISTINCT b.block_number) AS block_count,
                        COUNT(t.id) AS transaction_count,
                        COALESCE(SUM(t.value_wei), 0) AS total_value_wei,
                        AVG(t.gas_price_wei) AS average_gas_price_wei,
                        AVG(t.gas_used)::numeric(20, 2) AS average_gas_used
                    FROM blocks b
                    LEFT JOIN transactions t
                        ON t.chain_id = b.chain_id
                       AND t.block_number = b.block_number
                    WHERE b.chain_id = ?
                      AND b.block_timestamp >= ?
                      AND b.block_timestamp < ?
                    GROUP BY b.block_timestamp::date
                )
                SELECT
                    metric_date,
                    block_count,
                    transaction_count,
                    total_value_wei,
                    average_gas_price_wei,
                    average_gas_used,
                    LAG(transaction_count, 1, 0) OVER (ORDER BY metric_date) AS previous_day_transaction_count,
                    transaction_count - LAG(transaction_count, 1, 0) OVER (ORDER BY metric_date) AS transaction_count_delta,
                    RANK() OVER (ORDER BY transaction_count DESC) AS transaction_count_rank
                FROM daily
                ORDER BY metric_date ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new DailyNetworkMetricResponse(
                        rs.getDate("metric_date").toLocalDate(),
                        rs.getLong("block_count"),
                        rs.getLong("transaction_count"),
                        toPlainString(rs.getBigDecimal("total_value_wei")),
                        toPlainString(rs.getBigDecimal("average_gas_price_wei")),
                        rs.getBigDecimal("average_gas_used"),
                        rs.getLong("previous_day_transaction_count"),
                        rs.getLong("transaction_count_delta"),
                        rs.getLong("transaction_count_rank")
                ),
                chainId,
                Timestamp.from(startOfDay(from)),
                Timestamp.from(startOfNextDay(to))
        );
    }

    public List<LargestTransactionResponse> findLargestTransactions(
            long chainId,
            LocalDate from,
            LocalDate to,
            int limit
    ) {
        String sql = """
                SELECT
                    value_rank,
                    transaction_hash,
                    block_number,
                    from_address,
                    to_address,
                    value_wei,
                    gas_price_wei,
                    gas_used,
                    status,
                    block_timestamp
                FROM (
                    SELECT
                        RANK() OVER (ORDER BY value_wei DESC) AS value_rank,
                        transaction_hash,
                        block_number,
                        from_address,
                        to_address,
                        value_wei,
                        gas_price_wei,
                        gas_used,
                        status,
                        block_timestamp
                    FROM transactions
                    WHERE chain_id = ?
                      AND block_timestamp >= ?
                      AND block_timestamp < ?
                ) ranked_transactions
                WHERE value_rank <= ?
                ORDER BY value_rank ASC, block_timestamp DESC, transaction_hash ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new LargestTransactionResponse(
                        rs.getLong("value_rank"),
                        rs.getString("transaction_hash"),
                        rs.getLong("block_number"),
                        rs.getString("from_address"),
                        rs.getString("to_address"),
                        toPlainString(rs.getBigDecimal("value_wei")),
                        toPlainString(rs.getBigDecimal("gas_price_wei")),
                        getNullableLong(rs, "gas_used"),
                        getNullableInteger(rs, "status"),
                        rs.getTimestamp("block_timestamp").toInstant()
                ),
                chainId,
                Timestamp.from(startOfDay(from)),
                Timestamp.from(startOfNextDay(to)),
                limit
        );
    }

    private Instant startOfDay(LocalDate date) {
        return date.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private Instant startOfNextDay(LocalDate date) {
        return date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private String toPlainString(BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }

    private Long getNullableLong(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        long value = rs.getLong(columnName);
        return rs.wasNull() ? null : value;
    }

    private Integer getNullableInteger(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }
}
