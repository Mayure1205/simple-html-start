package com.chainsight.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executor;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Configuration
public class IngestionExecutorConfig {

    @Bean(name = "blockExtractionExecutor", destroyMethod = "shutdown")
    public Executor blockExtractionExecutor(
            @Value("${ethereum.ingestion.executor.core-pool-size}") int corePoolSize,
            @Value("${ethereum.ingestion.executor.max-pool-size}") int maxPoolSize,
            @Value("${ethereum.ingestion.executor.queue-capacity}") int queueCapacity
    ) {
        validateExecutorSettings(corePoolSize, maxPoolSize, queueCapacity);

        AtomicInteger threadNumber = new AtomicInteger(1);
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                corePoolSize,
                maxPoolSize,
                30,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(queueCapacity),
                runnable -> {
                    Thread thread = new Thread(runnable);
                    thread.setName("block-extractor-" + threadNumber.getAndIncrement());
                    thread.setDaemon(true);
                    return thread;
                },
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
        executor.allowCoreThreadTimeOut(true);
        return executor;
    }

    private void validateExecutorSettings(int corePoolSize, int maxPoolSize, int queueCapacity) {
        if (corePoolSize <= 0) {
            throw new IllegalArgumentException("ethereum.ingestion.executor.core-pool-size must be positive");
        }
        if (maxPoolSize < corePoolSize) {
            throw new IllegalArgumentException(
                    "ethereum.ingestion.executor.max-pool-size must be greater than or equal to core-pool-size"
            );
        }
        if (queueCapacity <= 0) {
            throw new IllegalArgumentException("ethereum.ingestion.executor.queue-capacity must be positive");
        }
    }
}
