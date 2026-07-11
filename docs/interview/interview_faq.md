# ChainSight Interview FAQ

Read this one day before interviews.

Q: Is this a blockchain app?
A: No. Ethereum is the public high-volume data source. ChainSight is a Java backend ETL and data warehouse project.

Q: Why Ethereum as the datasource?
A: Ethereum data is public, real, high-volume, and easy to access through RPC providers. It lets the project demonstrate real ingestion and analytics without fake data.

Q: Why PostgreSQL?
A: PostgreSQL gives ACID transactions, constraints, indexes, and analytical SQL in one mature database.

Q: Why JdbcTemplate instead of JPA?
A: Ingestion needs direct SQL, batch inserts, conflict handling, and predictable performance. JPA is better for entity CRUD, not high-volume ETL writes.

Q: Why Redis?
A: Redis is used for temporary runtime state: analytics cache, distributed ingestion lock, token-bucket rate limiting, and wallet-login nonces.

Q: Why CompletableFuture?
A: It lets the backend fetch blocks and receipts concurrently without manually managing every thread.

Q: Why ExecutorService/custom thread pools?
A: Custom bounded pools prevent unbounded concurrency and isolate job coordination, block extraction, and receipt fetching.

Q: Why not microservices?
A: A modular monolith is simpler to build, test, deploy, and explain. Microservices would add distributed complexity before the core ETL behavior is proven.

Q: Why Docker?
A: Docker gives repeatable PostgreSQL and Redis locally and prepares the app for a predictable production deployment.

Q: Why Flyway?
A: Flyway version-controls schema changes so local, test, and production databases can be migrated consistently.

Q: How is ingestion restart-safe?
A: The service uses checkpoints and transactional writes. If a block is committed, checkpoint advances. If a transaction rolls back, the checkpoint should not falsely advance.

Q: How are duplicates avoided?
A: Unique constraints and conflict handling make replays safe.

Q: Where are window functions used?
A: Network analytics uses SQL window functions like `LAG()` and `RANK()` for daily comparisons and ranked largest transactions.

Q: Does tracking a wallet prove ownership?
A: No. A tracked wallet is a watchlist row. Wallet sign-in separately proves control of the signing wallet.

Q: Is WalletConnect complete?
A: The frontend path is coded, but production verification needs a Reown Project ID and real wallet test.

Q: What is not done yet?
A: Full SIWE, production WalletConnect verification, AWS live deployment, RDS, benchmark results, passing remote CI evidence, token transfer extraction, and HTTPS/domain setup.
