package com.chainsight.auth.controller;

import com.chainsight.auth.dto.AuthResponse;
import com.chainsight.auth.dto.CurrentUserResponse;
import com.chainsight.auth.dto.LoginRequest;
import com.chainsight.auth.dto.RegisterRequest;
import com.chainsight.auth.model.AuthenticatedUserPrincipal;
import com.chainsight.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/nonce")
    public ResponseEntity<com.chainsight.auth.dto.NonceResponse> getNonce(@org.springframework.web.bind.annotation.RequestParam String walletAddress) {
        String nonce = authService.generateNonce(walletAddress);
        return ResponseEntity.ok(new com.chainsight.auth.dto.NonceResponse(nonce));
    }

    @PostMapping("/wallet-login")
    public ResponseEntity<AuthResponse> walletLogin(@Valid @RequestBody com.chainsight.auth.dto.WalletLoginRequest request) {
        return ResponseEntity.ok(authService.walletLogin(request));
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        return ResponseEntity.ok(authService.currentUser(principal.userId()));
    }
}
