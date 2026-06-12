package com.chainsight.ingestion.repository;

import com.chainsight.ingestion.model.BlockData;
import com.chainsight.ingestion.model.TransactionData;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigInteger;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class BlockJdbcRepository {

    private final JdbcTemplate jdbcTemplate;

    public BlockJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insertBlock(BlockData block, long chainId) {
        String sql = "INSERT INTO blocks (chain_id, block_number, block_hash, block_timestamp, base_fee_per_gas_wei, gas_used, gas_limit) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                     "ON CONFLICT (chain_id, block_number) DO NOTHING";

        jdbcTemplate.update(sql,
                chainId,
                block.getBlockNumber().longValue(),
                block.getBlockHash(),
                Timestamp.from(block.getBlockTimestamp()),
                block.getBaseFeePerGasWei(), // NUMERIC(78,0) works natively with BigDecimal/BigInteger
                block.getGasUsed(),
                block.getGasLimit());
    }

    public void insertTransactions(List<TransactionData> transactions, long chainId, Instant blockTimestamp) {
        if (transactions.isEmpty()) return;

        String sql = "INSERT INTO transactions (chain_id, block_number, transaction_hash, from_address, to_address, value_wei, gas_price_wei, gas_used, status, block_timestamp) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON CONFLICT (chain_id, transaction_hash) DO NOTHING";

        jdbcTemplate.batchUpdate(sql, transactions, 500, (PreparedStatement ps, TransactionData tx) -> {
            ps.setLong(1, chainId);
            ps.setLong(2, tx.getBlockNumber().longValue());
            ps.setString(3, tx.getTransactionHash());
            ps.setString(4, tx.getFromAddress());
            ps.setString(5, tx.getToAddress());
            ps.setBigDecimal(6, tx.getValueWei() != null ? new java.math.BigDecimal(tx.getValueWei()) : java.math.BigDecimal.ZERO);
            ps.setBigDecimal(7, tx.getGasPriceWei() != null ? new java.math.BigDecimal(tx.getGasPriceWei()) : null);
            ps.setObject(8, tx.getGasUsed());
            ps.setObject(9, tx.getStatus());
            ps.setTimestamp(10, Timestamp.from(blockTimestamp));
        });
    }

    public void updateCheckpoint(long chainId, BigInteger blockNumber) {
        String sql = "INSERT INTO ingestion_checkpoints (chain_id, last_processed_block, updated_at) " +
                     "VALUES (?, ?, CURRENT_TIMESTAMP) " +
                     "ON CONFLICT (chain_id) DO UPDATE SET " +
                     "last_processed_block = GREATEST(ingestion_checkpoints.last_processed_block, EXCLUDED.last_processed_block), " +
                     "updated_at = CURRENT_TIMESTAMP";

        jdbcTemplate.update(sql, chainId, blockNumber.longValue());
    }
}
