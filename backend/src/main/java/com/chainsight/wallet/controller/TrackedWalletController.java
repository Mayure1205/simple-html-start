package com.chainsight.wallet.controller;

import com.chainsight.auth.model.AuthenticatedUserPrincipal;
import com.chainsight.wallet.dto.TrackedWalletRequest;
import com.chainsight.wallet.dto.TrackedWalletResponse;
import com.chainsight.wallet.service.TrackedWalletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tracked-wallets")
public class TrackedWalletController {

    private final TrackedWalletService trackedWalletService;

    public TrackedWalletController(TrackedWalletService trackedWalletService) {
        this.trackedWalletService = trackedWalletService;
    }

    @GetMapping
    public ResponseEntity<List<TrackedWalletResponse>> getTrackedWallets(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        return ResponseEntity.ok(trackedWalletService.getTrackedWallets(principal.userId()));
    }

    @PostMapping
    public ResponseEntity<TrackedWalletResponse> trackWallet(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody TrackedWalletRequest request
    ) {
        return ResponseEntity.ok(trackedWalletService.trackWallet(principal.userId(), request));
    }

    @DeleteMapping("/{walletId}")
    public ResponseEntity<Void> deleteTrackedWallet(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable long walletId
    ) {
        trackedWalletService.deleteTrackedWallet(principal.userId(), walletId);
        return ResponseEntity.noContent().build();
    }
}
