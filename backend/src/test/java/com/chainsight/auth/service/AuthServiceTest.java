package com.chainsight.auth.service;

import com.chainsight.auth.dto.AuthResponse;
import com.chainsight.auth.dto.LoginRequest;
import com.chainsight.auth.dto.RegisterRequest;
import com.chainsight.auth.model.AuthenticatedUser;
import com.chainsight.auth.repository.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthRepository repository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(repository, passwordEncoder, jwtService);
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

    private AuthenticatedUser user() {
        return new AuthenticatedUser(
                10L,
                "mayu@example.com",
                "hash",
                Instant.parse("2026-06-13T10:00:00Z")
        );
    }
}
