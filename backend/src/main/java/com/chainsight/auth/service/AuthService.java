package com.chainsight.auth.service;

import com.chainsight.auth.dto.AuthResponse;
import com.chainsight.auth.dto.CurrentUserResponse;
import com.chainsight.auth.dto.LoginRequest;
import com.chainsight.auth.dto.RegisterRequest;
import com.chainsight.auth.dto.WalletLoginRequest;
import com.chainsight.auth.model.AuthenticatedUser;
import com.chainsight.auth.repository.AuthRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.SignatureException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Locale;

@Service
public class AuthService {

    private static final String NONCE_PREFIX = "chainsight:auth:nonce:";
    private static final Duration NONCE_TTL = Duration.ofMinutes(5);

    private final AuthRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(AuthRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService, StringRedisTemplate redisTemplate) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.redisTemplate = redisTemplate;
    }

    public String generateNonce(String walletAddress) {
        String normalizedWallet = normalizeWallet(walletAddress);
        byte[] nonceBytes = new byte[16];
        secureRandom.nextBytes(nonceBytes);
        String nonce = Numeric.toHexStringNoPrefix(nonceBytes);
        
        redisTemplate.opsForValue().set(NONCE_PREFIX + normalizedWallet, nonce, NONCE_TTL);
        return nonce;
    }

    public AuthResponse walletLogin(WalletLoginRequest request) {
        String normalizedWallet = normalizeWallet(request.walletAddress());
        String expectedNonce = redisTemplate.opsForValue().get(NONCE_PREFIX + normalizedWallet);
        
        if (expectedNonce == null) {
            throw new IllegalArgumentException("Nonce expired or not found. Please request a new nonce.");
        }

        String expectedMessage = "Sign this message to log in to ChainSight. Nonce: " + expectedNonce;
        
        String recoveredAddress = recoverAddress(expectedMessage, request.signature());
        if (!normalizedWallet.equalsIgnoreCase(recoveredAddress)) {
            throw new IllegalArgumentException("Signature verification failed. Recovered address does not match.");
        }

        // Clean up nonce after successful verification
        redisTemplate.delete(NONCE_PREFIX + normalizedWallet);

        // Find or create user
        AuthenticatedUser user = repository.findByWalletAddress(normalizedWallet)
                .orElseGet(() -> repository.createWalletUser(normalizedWallet));

        return authResponse(user);
    }

    private String recoverAddress(String originalMessage, String signature) {
        byte[] messageBytes = originalMessage.getBytes(StandardCharsets.UTF_8);
        byte[] signatureBytes = Numeric.hexStringToByteArray(signature);

        byte v = signatureBytes[64];
        if (v < 27) {
            v += 27;
        }

        Sign.SignatureData sd = new Sign.SignatureData(
                v,
                Arrays.copyOfRange(signatureBytes, 0, 32),
                Arrays.copyOfRange(signatureBytes, 32, 64)
        );

        try {
            BigInteger publicKey = Sign.signedPrefixedMessageToKey(messageBytes, sd);
            return "0x" + Keys.getAddress(publicKey);
        } catch (SignatureException e) {
            throw new IllegalArgumentException("Invalid signature format", e);
        }
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        try {
            AuthenticatedUser user = repository.createUser(email, passwordEncoder.encode(request.password()));
            return authResponse(user);
        } catch (DuplicateKeyException ex) {
            throw new IllegalArgumentException("email is already registered");
        }
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        AuthenticatedUser user = repository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new IllegalArgumentException("invalid email or password");
        }

        return authResponse(user);
    }

    public CurrentUserResponse currentUser(long userId) {
        AuthenticatedUser user = repository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("authenticated user was not found"));
        return toCurrentUserResponse(user);
    }

    private AuthResponse authResponse(AuthenticatedUser user) {
        return new AuthResponse(
                "Bearer",
                jwtService.createToken(user),
                jwtService.expiresInSeconds(),
                toCurrentUserResponse(user)
        );
    }

    private CurrentUserResponse toCurrentUserResponse(AuthenticatedUser user) {
        return new CurrentUserResponse(user.id(), user.email(), user.walletAddress(), user.createdAt());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeWallet(String walletAddress) {
        return walletAddress.trim().toLowerCase(Locale.ROOT);
    }
}
