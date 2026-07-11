# Ingestion Interview Notes

## 30 Second Answer

Ingestion fetches Ethereum blocks and receipts, maps them into warehouse records, writes them with JDBC batch inserts, and updates checkpoints so the system can resume safely after restarts.

## 2 Minute Answer

Single-block ingestion fetches one block and persists it. Range ingestion accepts a start and end block, creates a job, uses bounded executors and `CompletableFuture` to fetch data concurrently, and persists blocks in order. Checkpoints prevent reprocessing committed blocks. Failed blocks are recorded so they can be inspected and retried.

## Code Mapping

- Controller: `backend/src/main/java/com/chainsight/ingestion/controller/IngestionController.java`
- Service: `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- RPC adapter: `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`
- Repository: `backend/src/main/java/com/chainsight/ingestion/repository/BlockJdbcRepository.java`
- DTOs: `backend/src/main/java/com/chainsight/ingestion/dto`
- Data records: `backend/src/main/java/com/chainsight/ingestion/model`
- Tests: `backend/src/test/java/com/chainsight/ingestion`

Important methods:

- `BlockIngestionService.ingestBlock(...)`
- `BlockIngestionService.ingestRange(...)`
- `BlockIngestionService.retryFailedBlock(...)`
- `EthereumRpcAdapter.fetchBlock(...)`
- `EthereumRpcAdapter.fetchTransactionReceipt(...)`
- `BlockJdbcRepository.persistBlock(...)`

Database tables:

- `blocks`
- `transactions`
- `wallets`
- `ingestion_jobs`
- `ingestion_checkpoints`
- `failed_blocks`

## Concepts Used

| Concept | What it is | Why used here |
|---|---|---|
| ETL | Extract, transform, load | Ethereum RPC data is transformed into SQL rows |
| Checkpoint | Last successfully processed block | Allows resume after restart |
| ACID transaction | Atomic commit/rollback | Avoid partial block/checkpoint state |
| Idempotency | Safe retry behavior | Duplicate replays should not corrupt data |
| JDBC batch | Grouped SQL insert | Faster than one insert per row |
| Failed-block queue | Stored failure metadata | Lets user inspect/retry failed block |

## Failure Scenarios

| Failure | Current handling | Limitation |
|---|---|---|
| RPC block fetch fails | Job/block fails and failed block can be recorded | Needs real RPC runtime verification |
| Receipt fetch fails | Throws RPC exception | Retry/backoff is not fully implemented |
| Crash mid-block | Transaction should roll back | Docker integration test run pending |
| Duplicate replay | DB unique constraints/conflict handling | Monitoring not built |
| Overlapping range | Local and Redis guards reject | Redis availability matters |

## Interview Questions

Q: How do you avoid duplicate transactions?
A: Database unique constraints and conflict handling make replay safe.

Q: Why ordered persistence?
A: Checkpoints are block-number based, so commits should advance in order.

Q: Why not parallel database writes?
A: It would complicate checkpoint correctness. Current design parallelizes extraction and keeps loading ordered.

## Do Not Claim Yet

- Measured ingestion throughput.
- Retry with exponential backoff.
- Parallel database writes.
- ERC-20 token transfer ingestion.
