package com.chainsight.resilience;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class RedisTokenBucketRateLimiter {

    private static final Logger logger = LoggerFactory.getLogger(RedisTokenBucketRateLimiter.class);
    private static final String KEY_PREFIX = "chainsight:rate-limit:";

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<List> tokenBucketScript;
    private final long capacity;
    private final long refillTokensPerSecond;
    private final long keyTtlSeconds;

    public RedisTokenBucketRateLimiter(
            StringRedisTemplate redisTemplate,
            @Value("${resilience.rate-limit.capacity}") long capacity,
            @Value("${resilience.rate-limit.refill-tokens-per-second}") long refillTokensPerSecond,
            @Value("${resilience.rate-limit.key-ttl-seconds}") long keyTtlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.capacity = capacity;
        this.refillTokensPerSecond = refillTokensPerSecond;
        this.keyTtlSeconds = keyTtlSeconds;
        this.tokenBucketScript = new DefaultRedisScript<>(script(), List.class);
    }

    public boolean allowRequest(String bucketId) {
        try {
            List<String> keys = List.of(tokensKey(bucketId), timestampKey(bucketId));
            List<?> result = redisTemplate.execute(
                    tokenBucketScript,
                    keys,
                    String.valueOf(capacity),
                    String.valueOf(refillTokensPerSecond),
                    String.valueOf(Instant.now().getEpochSecond()),
                    "1",
                    String.valueOf(keyTtlSeconds)
            );
            return result == null || ((Number) result.get(0)).longValue() == 1L;
        } catch (RedisConnectionFailureException | RedisSystemException ex) {
            logger.warn("Redis rate limiter unavailable; allowing request for bucket {}", bucketId, ex);
            return true;
        }
    }

    private String tokensKey(String bucketId) {
        return KEY_PREFIX + bucketId + ":tokens";
    }

    private String timestampKey(String bucketId) {
        return KEY_PREFIX + bucketId + ":timestamp";
    }

    private String script() {
        return """
                local tokens_key = KEYS[1]
                local timestamp_key = KEYS[2]
                local capacity = tonumber(ARGV[1])
                local refill_rate = tonumber(ARGV[2])
                local now = tonumber(ARGV[3])
                local requested = tonumber(ARGV[4])
                local ttl = tonumber(ARGV[5])

                local last_tokens = tonumber(redis.call('get', tokens_key))
                if last_tokens == nil then
                    last_tokens = capacity
                end

                local last_refreshed = tonumber(redis.call('get', timestamp_key))
                if last_refreshed == nil then
                    last_refreshed = now
                end

                local delta = math.max(0, now - last_refreshed)
                local filled_tokens = math.min(capacity, last_tokens + (delta * refill_rate))
                local allowed = filled_tokens >= requested
                local new_tokens = filled_tokens

                if allowed then
                    new_tokens = filled_tokens - requested
                end

                redis.call('setex', tokens_key, ttl, new_tokens)
                redis.call('setex', timestamp_key, ttl, now)

                if allowed then
                    return {1, new_tokens}
                end
                return {0, new_tokens}
                """;
    }
}
