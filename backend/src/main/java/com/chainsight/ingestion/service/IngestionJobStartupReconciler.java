package com.chainsight.ingestion.service;

import com.chainsight.ingestion.repository.BlockJdbcRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class IngestionJobStartupReconciler implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(IngestionJobStartupReconciler.class);

    private final BlockJdbcRepository repository;
    private final BlockIngestionService ingestionService;
    private final Duration staleJobTimeout;

    public IngestionJobStartupReconciler(
            BlockJdbcRepository repository,
            BlockIngestionService ingestionService,
            @Value("${ethereum.ingestion.stale-job-timeout-seconds}") long staleJobTimeoutSeconds
    ) {
        this.repository = repository;
        this.ingestionService = ingestionService;
        this.staleJobTimeout = Duration.ofSeconds(staleJobTimeoutSeconds);
    }

    @Override
    public void run(ApplicationArguments args) {
        ingestionService.clearActiveRangeJobSlots();

        Instant cutoff = Instant.now().minus(staleJobTimeout);
        int reconciledRows = repository.markStaleActiveJobsFailed(
                cutoff,
                "Marked FAILED on startup because the job was still active after application restart"
        );

        if (reconciledRows > 0) {
            logger.warn("Marked {} stale ingestion job(s) as FAILED on startup", reconciledRows);
        }
    }
}
