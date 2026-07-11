package com.chainsight.ingestion.service;

import com.chainsight.ingestion.repository.BlockJdbcRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IngestionJobStartupReconcilerTest {

    @Test
    void startupClearsLocalJobSlotsAndMarksStaleJobsFailed() {
        BlockJdbcRepository repository = mock(BlockJdbcRepository.class);
        BlockIngestionService ingestionService = mock(BlockIngestionService.class);
        ApplicationArguments args = mock(ApplicationArguments.class);
        IngestionJobStartupReconciler reconciler = new IngestionJobStartupReconciler(
                repository,
                ingestionService,
                900
        );

        when(repository.markStaleActiveJobsFailed(any(Instant.class), contains("startup"))).thenReturn(2);

        reconciler.run(args);

        verify(ingestionService).clearActiveRangeJobSlots();
        verify(repository).markStaleActiveJobsFailed(any(Instant.class), contains("startup"));
    }
}
