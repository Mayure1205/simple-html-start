# Concurrency Interview Notes

## 30 Second Answer

ChainSight uses bounded custom executors and `CompletableFuture` to fetch blocks and receipts concurrently while keeping database writes ordered for checkpoint safety.

## Code Mapping

- Executor config: `backend/src/main/java/com/chainsight/config/IngestionExecutorConfig.java`
- Ingestion service: `backend/src/main/java/com/chainsight/ingestion/service/BlockIngestionService.java`
- RPC adapter: `backend/src/main/java/com/chainsight/ingestion/service/EthereumRpcAdapter.java`
- Config values: `backend/src/main/resources/application.yml`
- Tests: `backend/src/test/java/com/chainsight/ingestion/service/BlockIngestionServiceTest.java`

## Concepts Used

| Concept | What it is | Why used | Alternative | Trade-off |
|---|---|---|---|---|
| `ThreadPoolExecutor` | Configurable worker pool | Bound concurrency and queue size | Common pool | More config, safer under load |
| `ExecutorService` | Java abstraction for async tasks | Separates job/block/receipt work | Synchronous calls | More complexity |
| `CompletableFuture` | Async computation pipeline | Compose parallel fetches | Manual threads | Easier fan-in but errors need care |
| `ConcurrentHashMap` | Thread-safe map | Track active same-chain jobs | `synchronized` map | More scalable, still local JVM only |
| Ordered load | Persist by block order | Keeps checkpoints sane | Parallel writes | Safer, potentially lower write throughput |

## Current Model

- Job coordinator executor accepts async jobs.
- Block extraction executor fetches blocks concurrently.
- Receipt fetch executor fetches receipts concurrently.
- Persistence stays ordered.
- Redis lock handles cross-instance overlap.
- `ConcurrentHashMap` handles same-JVM overlap.

## Interview Questions

Q: Why not use the common ForkJoinPool?
A: Custom pools let us bound concurrency and isolate job coordination, block fetch, and receipt fetch workloads.

Q: Why use `CompletableFuture`?
A: It represents async fetch work and lets the service wait for multiple RPC calls without manually managing threads.

Q: What deadlock risk exists?
A: Nested async work can deadlock if the same small executor is used for parent and child tasks. Separate bounded pools reduce that risk.

Q: Why ordered DB writes?
A: Checkpoints are sequential. Ordered writes make restart behavior easier to reason about.

## Do Not Claim Yet

- Parallel database writes.
- Measured thread-pool throughput.
- Production load testing.
