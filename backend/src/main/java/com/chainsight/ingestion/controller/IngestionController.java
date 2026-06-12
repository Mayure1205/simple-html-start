package com.chainsight.ingestion.controller;

import com.chainsight.ingestion.dto.IngestionResult;
import com.chainsight.ingestion.service.BlockIngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigInteger;

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
}
