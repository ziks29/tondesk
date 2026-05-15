## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2025-01-24 - Database-level distinct counting for unique users
**Learning:** Calculating distinct counts by fetching large grouped datasets via `prisma.interaction.groupBy` and iterating in Node.js creates memory bottlenecks and high data transfer latency. High row counts significantly increase serialization and Node.js processing costs.
**Action:** To calculate distinct counts efficiently, use `prisma.$queryRaw` with `COUNT(DISTINCT)` directly in the database. Explicitly cast results using `Number()` to ensure compatibility and use `Prisma.join(array)` for `IN` clauses to ensure proper parameterization (handling empty arrays by conditionally executing the query).
