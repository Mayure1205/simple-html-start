package com.chainsight.resilience;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
public class RedisIngestionLockService {

    private static final String LOCK_KEY_PREFIX = "chainsight:ingestion:lock:chain:";

    private final StringRedisTemplate redisTemplate;
    private final Duration lockTtl;
    private final DefaultRedisScript<Long> releaseScript;

    public RedisIngestionLockService(
            StringRedisTemplate redisTemplate,
            @Value("${resilience.ingestion-lock.ttl-seconds}") long lockTtlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.lockTtl = Duration.ofSeconds(lockTtlSeconds);
        this.releaseScript = new DefaultRedisScript<>(
                "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                "return redis.call('del', KEYS[1]) " +
                "else return 0 end",
                Long.class
        );
    }

    public String acquireRangeLock(long chainId, BigInteger startBlock, BigInteger endBlock) {
        String token = UUID.randomUUID().toString();
        String key = lockKey(chainId);
        String value = token + ":" + startBlock + ":" + endBlock;

        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, value, lockTtl);
        if (!Boolean.TRUE.equals(acquired)) {
            throw new IllegalArgumentException("Another ingestion job is already running for chainId " + chainId);
        }

        return value;
    }

    public void releaseRangeLock(long chainId, String token) {
        redisTemplate.execute(releaseScript, List.of(lockKey(chainId)), token);
    }

    private String lockKey(long chainId) {
        return LOCK_KEY_PREFIX + chainId;
    }
}
