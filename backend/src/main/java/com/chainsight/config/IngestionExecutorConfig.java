package com.chainsight.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread pools for the ingestion pipeline.
 *
 * Three pools with distinct responsibilities, kept separate so a task in one
 * pool never blocks waiting on work queued behind it in the same pool:
 * - jobCoordinatorExecutor: runs long-lived range-job coordinators so HTTP
 *   requests can return immediately
 * - blockExtractionExecutor: parallel block fetches within a range job
 * - receiptFetchExecutor: parallel transaction-receipt fetches within a block
 */
@Configuration
public class IngestionExecutorConfig {

    @Bean(name = "blockExtractionExecutor", destroyMethod = "shutdown")
    public Executor blockExtractionExecutor(
            @Value("${ethereum.ingestion.executor.core-pool-size}") int corePoolSize,
            @Value("${ethereum.ingestion.executor.max-pool-size}") int maxPoolSize,
            @Value("${ethereum.ingestion.executor.queue-capacity}") int queueCapacity
    ) {
        validateExecutorSettings("ethereum.ingestion.executor", corePoolSize, maxPoolSize, queueCapacity);
        return newBoundedExecutor("block-extractor-", corePoolSize, maxPoolSize, queueCapacity);
    }

    @Bean(name = "receiptFetchExecutor", destroyMethod = "shutdown")
    public Executor receiptFetchExecutor(
            @Value("${ethereum.ingestion.receipt-executor.core-pool-size}") int corePoolSize,
            @Value("${ethereum.ingestion.receipt-executor.max-pool-size}") int maxPoolSize,
            @Value("${ethereum.ingestion.receipt-executor.queue-capacity}") int queueCapacity
    ) {
        validateExecutorSettings("ethereum.ingestion.receipt-executor", corePoolSize, maxPoolSize, queueCapacity);
        return newBoundedExecutor("receipt-fetcher-", corePoolSize, maxPoolSize, queueCapacity);
    }

    @Bean(name = "jobCoordinatorExecutor", destroyMethod = "shutdown")
    public ExecutorService jobCoordinatorExecutor() {
        AtomicInteger threadNumber = new AtomicInteger(1);
        return Executors.newCachedThreadPool(runnable -> {
            Thread thread = new Thread(runnable);
            thread.setName("job-coordinator-" + threadNumber.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        });
    }

    private Executor newBoundedExecutor(String threadNamePrefix, int corePoolSize, int maxPoolSize, int queueCapacity) {
        AtomicInteger threadNumber = new AtomicInteger(1);
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                corePoolSize,
                maxPoolSize,
                30,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(queueCapacity),
                runnable -> {
                    Thread thread = new Thread(runnable);
                    thread.setName(threadNamePrefix + threadNumber.getAndIncrement());
                    thread.setDaemon(true);
                    return thread;
                },
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
        executor.allowCoreThreadTimeOut(true);
        return executor;
    }

    private void validateExecutorSettings(String prefix, int corePoolSize, int maxPoolSize, int queueCapacity) {
        if (corePoolSize <= 0) {
            throw new IllegalArgumentException(prefix + ".core-pool-size must be positive");
        }
        if (maxPoolSize < corePoolSize) {
            throw new IllegalArgumentException(
                    prefix + ".max-pool-size must be greater than or equal to core-pool-size"
            );
        }
        if (queueCapacity <= 0) {
            throw new IllegalArgumentException(prefix + ".queue-capacity must be positive");
        }
    }
}
