package com.chainsight.auth.repository;

import com.chainsight.auth.model.AuthenticatedUser;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Map;
import java.util.Optional;

@Repository
public class AuthRepository {

    private final JdbcTemplate jdbcTemplate;

    public AuthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AuthenticatedUser createUser(String email, String passwordHash) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO app_users (email, password_hash) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, email);
            ps.setString(2, passwordHash);
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        Number id = keys == null ? keyHolder.getKey() : (Number) keys.get("id");
        return findById(id.longValue())
                .orElseThrow(() -> new IllegalStateException("Created user was not found"));
    }

    public AuthenticatedUser createWalletUser(String walletAddress) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO app_users (wallet_address) VALUES (?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, walletAddress);
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        Number id = keys == null ? keyHolder.getKey() : (Number) keys.get("id");
        return findById(id.longValue())
                .orElseThrow(() -> new IllegalStateException("Created user was not found"));
    }

    public Optional<AuthenticatedUser> findByEmail(String email) {
        try {
            return Optional.of(jdbcTemplate.queryForObject(
                    """
                    SELECT id, email, password_hash, wallet_address, created_at
                    FROM app_users
                    WHERE email = ?
                    """,
                    (rs, rowNum) -> new AuthenticatedUser(
                            rs.getLong("id"),
                            rs.getString("email"),
                            rs.getString("password_hash"),
                            rs.getString("wallet_address"),
                            rs.getTimestamp("created_at").toInstant()
                    ),
                    email
            ));
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    public Optional<AuthenticatedUser> findByWalletAddress(String walletAddress) {
        try {
            return Optional.of(jdbcTemplate.queryForObject(
                    """
                    SELECT id, email, password_hash, wallet_address, created_at
                    FROM app_users
                    WHERE wallet_address = ?
                    """,
                    (rs, rowNum) -> new AuthenticatedUser(
                            rs.getLong("id"),
                            rs.getString("email"),
                            rs.getString("password_hash"),
                            rs.getString("wallet_address"),
                            rs.getTimestamp("created_at").toInstant()
                    ),
                    walletAddress
            ));
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    public Optional<AuthenticatedUser> findById(long userId) {
        try {
            return Optional.of(jdbcTemplate.queryForObject(
                    """
                    SELECT id, email, password_hash, wallet_address, created_at
                    FROM app_users
                    WHERE id = ?
                    """,
                    (rs, rowNum) -> new AuthenticatedUser(
                            rs.getLong("id"),
                            rs.getString("email"),
                            rs.getString("password_hash"),
                            rs.getString("wallet_address"),
                            rs.getTimestamp("created_at").toInstant()
                    ),
                    userId
            ));
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }
}
