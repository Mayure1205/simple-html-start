package com.chainsight.ingestion.controller;

import com.chainsight.ingestion.dto.FailedBlockResponse;
import com.chainsight.ingestion.dto.IngestionResult;
import com.chainsight.ingestion.dto.IngestionJobResponse;
import com.chainsight.ingestion.dto.IngestionStatusResponse;
import com.chainsight.ingestion.dto.StartIngestionRequest;
import com.chainsight.ingestion.service.BlockIngestionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ingestion")
public class IngestionController {

    private final BlockIngestionService ingestionService;

    public IngestionController(BlockIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/blocks/{blockNumber}")
    public ResponseEntity<IngestionResult> ingestBlock(@PathVariable BigInteger blockNumber) {
        IngestionResult result = ingestionService.ingestBlock(blockNumber);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/jobs")
    public ResponseEntity<IngestionJobResponse> ingestRange(@Valid @RequestBody StartIngestionRequest request) {
        IngestionJobResponse response = ingestionService.ingestRange(request);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/status")
    public ResponseEntity<IngestionStatusResponse> getStatus(@RequestParam(defaultValue = "1") long chainId) {
        return ResponseEntity.ok(ingestionService.getStatus(chainId));
    }

    @GetMapping("/failed-blocks")
    public ResponseEntity<List<FailedBlockResponse>> getFailedBlocks(
            @RequestParam(defaultValue = "1") long chainId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(ingestionService.getFailedBlocks(chainId, status));
    }

    @PostMapping("/failed-blocks/{blockNumber}/retry")
    public ResponseEntity<IngestionResult> retryFailedBlock(
            @PathVariable BigInteger blockNumber,
            @RequestParam(defaultValue = "1") long chainId
    ) {
        return ResponseEntity.ok(ingestionService.retryFailedBlock(chainId, blockNumber));
    }
}
