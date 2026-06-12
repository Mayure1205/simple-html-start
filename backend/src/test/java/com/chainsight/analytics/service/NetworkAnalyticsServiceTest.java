package com.chainsight.analytics.service;

import com.chainsight.analytics.dto.DailyNetworkMetricResponse;
import com.chainsight.analytics.dto.LargestTransactionResponse;
import com.chainsight.analytics.dto.NetworkDailyAnalyticsResponse;
import com.chainsight.analytics.dto.NetworkLargestTransactionsResponse;
import com.chainsight.analytics.repository.NetworkAnalyticsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NetworkAnalyticsServiceTest {

    private static final long ETHEREUM_CHAIN_ID = 1L;
    private static final int MAX_LIMIT = 100;

    @Mock
    private NetworkAnalyticsRepository repository;

    private NetworkAnalyticsService service;

    @BeforeEach
    void setUp() {
        service = new NetworkAnalyticsService(repository, ETHEREUM_CHAIN_ID, MAX_LIMIT);
    }

    @Test
    void getDailyMetricsReturnsRepositoryData() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 12);
        List<DailyNetworkMetricResponse> days = List.of(new DailyNetworkMetricResponse(
                from,
                7_200,
                1_180_000,
                "123450000000000000000000",
                "32000000000",
                new BigDecimal("21000.00"),
                1_100_000,
                80_000,
                1
        ));
        when(repository.findDailyMetrics(ETHEREUM_CHAIN_ID, from, to)).thenReturn(days);

        NetworkDailyAnalyticsResponse response = service.getDailyMetrics(ETHEREUM_CHAIN_ID, from, to);

        assertThat(response.chainId()).isEqualTo(ETHEREUM_CHAIN_ID);
        assertThat(response.from()).isEqualTo(from);
        assertThat(response.to()).isEqualTo(to);
        assertThat(response.days()).isEqualTo(days);
        verify(repository).findDailyMetrics(ETHEREUM_CHAIN_ID, from, to);
    }

    @Test
    void getLargestTransactionsReturnsRepositoryData() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 12);
        List<LargestTransactionResponse> transactions = List.of(new LargestTransactionResponse(
                1,
                "0xtx1",
                22_000_001L,
                "0xaaa",
                "0xbbb",
                "1000000000000000000",
                "32000000000",
                21_000L,
                1,
                Instant.parse("2026-06-12T09:00:00Z")
        ));
        when(repository.findLargestTransactions(ETHEREUM_CHAIN_ID, from, to, 50)).thenReturn(transactions);

        NetworkLargestTransactionsResponse response = service.getLargestTransactions(
                ETHEREUM_CHAIN_ID,
                from,
                to,
                50
        );

        assertThat(response.transactions()).isEqualTo(transactions);
        assertThat(response.limit()).isEqualTo(50);
        verify(repository).findLargestTransactions(ETHEREUM_CHAIN_ID, from, to, 50);
    }

    @Test
    void rejectsUnsupportedChain() {
        assertThatThrownBy(() -> service.getDailyMetrics(
                137L,
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 12)
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only Ethereum chainId 1 is supported in MVP");

        verifyNoInteractions(repository);
    }

    @Test
    void rejectsInvalidDateRange() {
        assertThatThrownBy(() -> service.getDailyMetrics(
                ETHEREUM_CHAIN_ID,
                LocalDate.of(2026, 6, 12),
                LocalDate.of(2026, 6, 1)
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("from date must be before or equal to to date");

        verifyNoInteractions(repository);
    }

    @Test
    void rejectsLimitAboveConfiguredMaximum() {
        assertThatThrownBy(() -> service.getLargestTransactions(
                ETHEREUM_CHAIN_ID,
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 12),
                101
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("limit must be 100 or fewer");

        verifyNoInteractions(repository);
    }
}
