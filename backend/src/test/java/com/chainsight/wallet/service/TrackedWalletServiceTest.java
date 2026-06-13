package com.chainsight.wallet.service;

import com.chainsight.wallet.dto.TrackedWalletRequest;
import com.chainsight.wallet.dto.TrackedWalletResponse;
import com.chainsight.wallet.repository.TrackedWalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrackedWalletServiceTest {

    private static final long USER_ID = 10L;
    private static final long ETHEREUM_CHAIN_ID = 1L;
    private static final String WALLET = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    @Mock
    private TrackedWalletRepository repository;

    private TrackedWalletService service;

    @BeforeEach
    void setUp() {
        service = new TrackedWalletService(repository, ETHEREUM_CHAIN_ID);
    }

    @Test
    void getTrackedWalletsReturnsRepositoryRows() {
        List<TrackedWalletResponse> wallets = List.of(wallet());
        when(repository.findAllForUser(USER_ID)).thenReturn(wallets);

        assertThat(service.getTrackedWallets(USER_ID)).isEqualTo(wallets);
    }

    @Test
    void trackWalletNormalizesAddressAndLabel() {
        TrackedWalletResponse wallet = wallet();
        when(repository.create(USER_ID, ETHEREUM_CHAIN_ID, WALLET, "Main wallet")).thenReturn(wallet);

        TrackedWalletResponse response = service.trackWallet(
                USER_ID,
                new TrackedWalletRequest(
                        ETHEREUM_CHAIN_ID,
                        "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                        "  Main wallet  "
                )
        );

        assertThat(response).isEqualTo(wallet);
        verify(repository).create(USER_ID, ETHEREUM_CHAIN_ID, WALLET, "Main wallet");
    }

    @Test
    void trackWalletRejectsInvalidAddress() {
        assertThatThrownBy(() -> service.trackWallet(
                USER_ID,
                new TrackedWalletRequest(ETHEREUM_CHAIN_ID, "not-an-address", "Bad")
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("wallet address must be a 42-character Ethereum address");

        verifyNoInteractions(repository);
    }

    @Test
    void trackWalletRejectsUnsupportedChain() {
        assertThatThrownBy(() -> service.trackWallet(
                USER_ID,
                new TrackedWalletRequest(137L, WALLET, "Polygon")
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only Ethereum chainId 1 is supported in MVP");

        verifyNoInteractions(repository);
    }

    @Test
    void trackWalletRejectsDuplicateWallet() {
        when(repository.create(USER_ID, ETHEREUM_CHAIN_ID, WALLET, null))
                .thenThrow(new DuplicateKeyException("duplicate"));

        assertThatThrownBy(() -> service.trackWallet(
                USER_ID,
                new TrackedWalletRequest(ETHEREUM_CHAIN_ID, WALLET, null)
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("wallet is already tracked by this user");
    }

    @Test
    void deleteTrackedWalletRejectsUnknownWallet() {
        when(repository.deleteForUser(USER_ID, 55L)).thenReturn(0);

        assertThatThrownBy(() -> service.deleteTrackedWallet(USER_ID, 55L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("tracked wallet was not found");
    }

    private TrackedWalletResponse wallet() {
        return new TrackedWalletResponse(
                1L,
                ETHEREUM_CHAIN_ID,
                WALLET,
                "Main wallet",
                Instant.parse("2026-06-13T10:00:00Z")
        );
    }
}
