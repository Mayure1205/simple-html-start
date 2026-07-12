package com.chainsight.analytics.service;

import com.chainsight.analytics.dto.WalletDailyFlowResponse;
import com.chainsight.analytics.dto.WalletCounterpartiesResponse;
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
import java.util.Optional;

@Service
public class WalletAnalyticsCacheService {

    private static final Logger logger = LoggerFactory.getLogger(WalletAnalyticsCacheService.class);
    private static final String CACHE_KEY_PREFIX = "chainsight:analytics:wallet:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;

    public WalletAnalyticsCacheService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${analytics.cache.ttl-seconds}") long ttlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    public Optional<WalletDailyFlowResponse> getDailyFlow(long chainId, String address, int days) {
        return readCache(dailyFlowKey(chainId, address, days), WalletDailyFlowResponse.class);
    }

    public void putDailyFlow(WalletDailyFlowResponse response, int days) {
        writeCache(dailyFlowKey(response.chainId(), response.address(), days), response);
    }

    public Optional<WalletCounterpartiesResponse> getCounterparties(long chainId, String address, int limit) {
        return readCache(counterpartiesKey(chainId, address, limit), WalletCounterpartiesResponse.class);
    }

    public void putCounterparties(WalletCounterpartiesResponse response, int limit) {
        writeCache(counterpartiesKey(response.chainId(), response.address(), limit), response);
    }

    private <T> Optional<T> readCache(String key, Class<T> responseType) {
        try {
            String cachedValue = redisTemplate.opsForValue().get(key);
            if (cachedValue == null) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(cachedValue, responseType));
        } catch (JsonProcessingException | RedisConnectionFailureException | RedisSystemException ex) {
            logger.warn("Wallet analytics cache read failed for key {}", key, ex);
            return Optional.empty();
        }
    }

    private void writeCache(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value), ttl);
        } catch (JsonProcessingException | RedisConnectionFailureException | RedisSystemException ex) {
            logger.warn("Wallet analytics cache write failed for key {}", key, ex);
        }
    }

    private String dailyFlowKey(long chainId, String address, int days) {
        return CACHE_KEY_PREFIX + "daily-flow:" + chainId + ":" + address.toLowerCase() + ":" + days;
    }

    private String counterpartiesKey(long chainId, String address, int limit) {
        return CACHE_KEY_PREFIX + "counterparties:" + chainId + ":" + address.toLowerCase() + ":" + limit;
    }
}
