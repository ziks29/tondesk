## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-18 - Database Aggregation over Node.js Grouping
**Learning:** Using Prisma's groupBy to fetch large datasets grouped by multiple fields and then counting them in Node.js creates a memory bottleneck and increases data transfer volume.
**Action:** Use prisma.$queryRaw with COUNT(DISTINCT) directly in the database to aggregate results, using Prisma.join for IN clauses and casting BigInt to Number, which reduces overhead.
