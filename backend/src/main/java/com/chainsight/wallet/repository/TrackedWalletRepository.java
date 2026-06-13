package com.chainsight.wallet.repository;

import com.chainsight.wallet.dto.TrackedWalletResponse;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class TrackedWalletRepository {

    private final JdbcTemplate jdbcTemplate;

    public TrackedWalletRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public TrackedWalletResponse create(long userId, long chainId, String walletAddress, String label) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    INSERT INTO user_tracked_wallets (user_id, chain_id, wallet_address, label)
                    VALUES (?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, userId);
            ps.setLong(2, chainId);
            ps.setString(3, walletAddress);
            ps.setString(4, label);
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        Number id = keys == null ? keyHolder.getKey() : (Number) keys.get("id");
        return findByIdForUser(userId, id.longValue())
                .orElseThrow(() -> new IllegalStateException("Created tracked wallet was not found"));
    }

    public List<TrackedWalletResponse> findAllForUser(long userId) {
        return jdbcTemplate.query(
                """
                SELECT id, chain_id, wallet_address, label, created_at
                FROM user_tracked_wallets
                WHERE user_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (rs, rowNum) -> new TrackedWalletResponse(
                        rs.getLong("id"),
                        rs.getLong("chain_id"),
                        rs.getString("wallet_address"),
                        rs.getString("label"),
                        rs.getTimestamp("created_at").toInstant()
                ),
                userId
        );
    }

    public Optional<TrackedWalletResponse> findByIdForUser(long userId, long walletId) {
        try {
            return Optional.of(jdbcTemplate.queryForObject(
                    """
                    SELECT id, chain_id, wallet_address, label, created_at
                    FROM user_tracked_wallets
                    WHERE user_id = ?
                      AND id = ?
                    """,
                    (rs, rowNum) -> new TrackedWalletResponse(
                            rs.getLong("id"),
                            rs.getLong("chain_id"),
                            rs.getString("wallet_address"),
                            rs.getString("label"),
                            rs.getTimestamp("created_at").toInstant()
                    ),
                    userId,
                    walletId
            ));
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    public int deleteForUser(long userId, long walletId) {
        return jdbcTemplate.update(
                "DELETE FROM user_tracked_wallets WHERE user_id = ? AND id = ?",
                userId,
                walletId
        );
    }
}
