package com.chainsight.analytics.service;

import com.chainsight.analytics.dto.NetworkDailyAnalyticsResponse;
import com.chainsight.analytics.dto.NetworkLargestTransactionsResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class NetworkAnalyticsCacheService {

    private static final Logger logger = LoggerFactory.getLogger(NetworkAnalyticsCacheService.class);
    private static final String CACHE_KEY_PREFIX = "chainsight:analytics:network:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;

    public NetworkAnalyticsCacheService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${analytics.cache.ttl-seconds}") long ttlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    public Optional<NetworkDailyAnalyticsResponse> getDailyMetrics(long chainId, LocalDate from, LocalDate to) {
        return readCache(dailyKey(chainId, from, to), NetworkDailyAnalyticsResponse.class);
    }

    public void putDailyMetrics(NetworkDailyAnalyticsResponse response) {
        writeCache(dailyKey(response.chainId(), response.from(), response.to()), response);
    }

    public Optional<NetworkLargestTransactionsResponse> getLargestTransactions(
            long chainId,
            LocalDate from,
            LocalDate to,
            int limit
    ) {
        return readCache(largestTransactionsKey(chainId, from, to, limit), NetworkLargestTransactionsResponse.class);
    }

    public void putLargestTransactions(NetworkLargestTransactionsResponse response) {
        writeCache(
                largestTransactionsKey(response.chainId(), response.from(), response.to(), response.limit()),
                response
        );
    }

    private <T> Optional<T> readCache(String key, Class<T> responseType) {
        try {
            String cachedValue = redisTemplate.opsForValue().get(key);
            if (cachedValue == null) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(cachedValue, responseType));
        } catch (JsonProcessingException | RedisConnectionFailureException | RedisSystemException ex) {
            logger.warn("Analytics cache read failed for key {}", key, ex);
            return Optional.empty();
        }
    }

    private void writeCache(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value), ttl);
        } catch (JsonProcessingException | RedisConnectionFailureException | RedisSystemException ex) {
            logger.warn("Analytics cache write failed for key {}", key, ex);
        }
    }

    private String dailyKey(long chainId, LocalDate from, LocalDate to) {
        return CACHE_KEY_PREFIX + "daily:" + chainId + ":" + from + ":" + to;
    }

    private String largestTransactionsKey(long chainId, LocalDate from, LocalDate to, int limit) {
        return CACHE_KEY_PREFIX + "largest-transactions:" + chainId + ":" + from + ":" + to + ":" + limit;
    }
}
