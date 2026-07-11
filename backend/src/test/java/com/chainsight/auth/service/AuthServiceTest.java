package com.chainsight.auth.service;

import com.chainsight.auth.dto.AuthResponse;
import com.chainsight.auth.dto.LoginRequest;
import com.chainsight.auth.dto.NonceResponse;
import com.chainsight.auth.dto.RegisterRequest;
import com.chainsight.auth.dto.WalletLoginRequest;
import com.chainsight.auth.model.AuthenticatedUser;
import com.chainsight.auth.repository.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String WALLET = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    @Mock
    private AuthRepository repository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(repository, passwordEncoder, jwtService, redisTemplate);
    }

    @Test
    void registerNormalizesEmailHashesPasswordAndReturnsJwt() {
        AuthenticatedUser user = user();
        when(passwordEncoder.encode("password123")).thenReturn("hash");
        when(repository.createUser("mayu@example.com", "hash")).thenReturn(user);
        when(jwtService.createToken(user)).thenReturn("jwt-token");
        when(jwtService.expiresInSeconds()).thenReturn(86_400L);

        AuthResponse response = service.register(new RegisterRequest("MAYU@Example.COM", "password123"));

        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("mayu@example.com");
        verify(repository).createUser("mayu@example.com", "hash");
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(repository.createUser("mayu@example.com", "hash"))
                .thenThrow(new DuplicateKeyException("duplicate"));

        assertThatThrownBy(() -> service.register(new RegisterRequest("mayu@example.com", "password123")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("email is already registered");
    }

    @Test
    void loginRejectsWrongPassword() {
        AuthenticatedUser user = user();
        when(repository.findByEmail("mayu@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", user.passwordHash())).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("mayu@example.com", "wrong-password")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("invalid email or password");
    }

    @Test
    void currentUserReturnsUserProfile() {
        when(repository.findById(10L)).thenReturn(Optional.of(user()));

        assertThat(service.currentUser(10L).email()).isEqualTo("mayu@example.com");
    }

    @Test
    void createWalletLoginChallengeStoresNonceAndReturnsMessage() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        NonceResponse response = service.createWalletLoginChallenge("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

        assertThat(response.nonce()).hasSize(32);
        assertThat(response.message()).contains(WALLET);
        assertThat(response.message()).contains(response.nonce());
        verify(valueOperations).set(
                eq("chainsight:auth:nonce:" + WALLET),
                eq(response.nonce()),
                eq(Duration.ofMinutes(5))
        );
    }

    @Test
    void walletLoginVerifiesSignatureDeletesNonceAndReturnsJwt() throws Exception {
        ECKeyPair keyPair = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(keyPair);
        String nonce = "abc123";
        String message = AuthService.walletLoginMessage(wallet, nonce);
        String signature = signatureHex(Sign.signPrefixedMessage(message.getBytes(StandardCharsets.UTF_8), keyPair));
        AuthenticatedUser walletUser = new AuthenticatedUser(
                12L,
                null,
                null,
                wallet,
                Instant.parse("2026-06-13T10:00:00Z")
        );

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("chainsight:auth:nonce:" + wallet)).thenReturn(nonce);
        when(repository.findByWalletAddress(wallet)).thenReturn(Optional.of(walletUser));
        when(jwtService.createToken(walletUser)).thenReturn("wallet-jwt");
        when(jwtService.expiresInSeconds()).thenReturn(86_400L);

        AuthResponse response = service.walletLogin(new WalletLoginRequest(wallet, signature));

        assertThat(response.accessToken()).isEqualTo("wallet-jwt");
        assertThat(response.user().walletAddress()).isEqualTo(wallet);
        verify(redisTemplate).delete("chainsight:auth:nonce:" + wallet);
    }

    @Test
    void walletLoginRejectsExpiredNonce() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("chainsight:auth:nonce:" + WALLET)).thenReturn(null);

        assertThatThrownBy(() -> service.walletLogin(new WalletLoginRequest(WALLET, "0x00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Nonce expired or not found. Please request a new nonce.");

        verifyNoInteractions(repository);
    }

    @Test
    void walletLoginRejectsMalformedSignature() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("chainsight:auth:nonce:" + WALLET)).thenReturn("abc123");

        assertThatThrownBy(() -> service.walletLogin(new WalletLoginRequest(WALLET, "0x1234")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("signature must be 65 bytes");

        verifyNoMoreInteractions(repository);
    }

    @Test
    void walletLoginRejectsInvalidWalletAddress() {
        assertThatThrownBy(() -> service.walletLogin(new WalletLoginRequest("not-a-wallet", "0x00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("wallet address must be a 42-character Ethereum address");

        verifyNoInteractions(redisTemplate, repository);
    }

    private AuthenticatedUser user() {
        return new AuthenticatedUser(
                10L,
                "mayu@example.com",
                "hash",
                null,
                Instant.parse("2026-06-13T10:00:00Z")
        );
    }

    private String signatureHex(Sign.SignatureData signatureData) {
        byte[] signatureBytes = new byte[65];
        System.arraycopy(signatureData.getR(), 0, signatureBytes, 0, 32);
        System.arraycopy(signatureData.getS(), 0, signatureBytes, 32, 32);
        signatureBytes[64] = signatureData.getV()[0];
        return Numeric.toHexString(signatureBytes);
    }
}
