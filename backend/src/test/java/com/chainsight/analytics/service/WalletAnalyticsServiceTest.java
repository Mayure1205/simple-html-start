package com.chainsight.analytics.service;

import com.chainsight.analytics.dto.WalletSummaryResponse;
import com.chainsight.analytics.dto.WalletTransactionResponse;
import com.chainsight.analytics.dto.WalletTransactionsResponse;
import com.chainsight.analytics.repository.WalletAnalyticsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletAnalyticsServiceTest {

    private static final long ETHEREUM_CHAIN_ID = 1L;
    private static final int MAX_LIMIT = 100;
    private static final String WALLET = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    @Mock
    private WalletAnalyticsRepository repository;

    private WalletAnalyticsService service;

    @BeforeEach
    void setUp() {
        service = new WalletAnalyticsService(repository, ETHEREUM_CHAIN_ID, MAX_LIMIT);
    }

    @Test
    void getTransactionsReturnsPagedWalletHistory() {
        List<WalletTransactionResponse> transactions = List.of(new WalletTransactionResponse(
                "0xtx1",
                22_000_001L,
                "SENT",
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                WALLET,
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                "1000000000000000000",
                "32000000000",
                21_000L,
                1,
                Instant.parse("2026-06-12T09:00:00Z")
        ));
        when(repository.countTransactions(ETHEREUM_CHAIN_ID, WALLET)).thenReturn(51L);
        when(repository.findTransactions(ETHEREUM_CHAIN_ID, WALLET, 1, 50)).thenReturn(transactions);

        WalletTransactionsResponse response = service.getTransactions(ETHEREUM_CHAIN_ID, WALLET, 1, 50);

        assertThat(response.chainId()).isEqualTo(ETHEREUM_CHAIN_ID);
        assertThat(response.address()).isEqualTo(WALLET);
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(50);
        assertThat(response.totalTransactions()).isEqualTo(51L);
        assertThat(response.totalPages()).isEqualTo(2L);
        assertThat(response.transactions()).isEqualTo(transactions);
        verify(repository).countTransactions(ETHEREUM_CHAIN_ID, WALLET);
        verify(repository).findTransactions(ETHEREUM_CHAIN_ID, WALLET, 1, 50);
    }

    @Test
    void getTransactionsNormalizesUppercaseAddress() {
        String uppercaseWallet = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        when(repository.countTransactions(ETHEREUM_CHAIN_ID, WALLET)).thenReturn(0L);
        when(repository.findTransactions(ETHEREUM_CHAIN_ID, WALLET, 0, 25)).thenReturn(List.of());

        WalletTransactionsResponse response = service.getTransactions(ETHEREUM_CHAIN_ID, uppercaseWallet, 0, 25);

        assertThat(response.address()).isEqualTo(WALLET);
        assertThat(response.totalPages()).isZero();
        verify(repository).countTransactions(ETHEREUM_CHAIN_ID, WALLET);
        verify(repository).findTransactions(ETHEREUM_CHAIN_ID, WALLET, 0, 25);
    }

    @Test
    void getSummaryReturnsWalletTotals() {
        WalletSummaryResponse summary = new WalletSummaryResponse(
                ETHEREUM_CHAIN_ID,
                WALLET,
                3,
                5,
                "700000000000000000",
                "2000000000000000000",
                "1300000000000000000",
                Instant.parse("2026-06-01T00:00:00Z"),
                Instant.parse("2026-06-12T09:00:00Z")
        );
        when(repository.summarizeWallet(ETHEREUM_CHAIN_ID, WALLET)).thenReturn(summary);

        WalletSummaryResponse response = service.getSummary(ETHEREUM_CHAIN_ID, WALLET);

        assertThat(response).isEqualTo(summary);
        verify(repository).summarizeWallet(ETHEREUM_CHAIN_ID, WALLET);
    }

    @Test
    void rejectsUnsupportedChain() {
        assertThatThrownBy(() -> service.getTransactions(137L, WALLET, 0, 50))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only Ethereum chainId 1 is supported in MVP");

        verifyNoInteractions(repository);
    }

    @Test
    void rejectsInvalidWalletAddress() {
        assertThatThrownBy(() -> service.getSummary(ETHEREUM_CHAIN_ID, "not-an-address"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("wallet address must be a 42-character Ethereum address");

        verifyNoInteractions(repository);
    }

    @Test
    void rejectsPageBelowZero() {
        assertThatThrownBy(() -> service.getTransactions(ETHEREUM_CHAIN_ID, WALLET, -1, 50))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("page must be zero or greater");

        verifyNoInteractions(repository);
    }

    @Test
    void rejectsSizeAboveConfiguredMaximum() {
        assertThatThrownBy(() -> service.getTransactions(ETHEREUM_CHAIN_ID, WALLET, 0, 101))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("size must be 100 or fewer");

        verifyNoInteractions(repository);
    }
}
