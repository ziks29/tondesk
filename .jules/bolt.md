## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2026-05-01 - Database-level COUNT(DISTINCT) Optimization
**Learning:** Using `prisma.interaction.groupBy` and iterating in Node.js to calculate distinct counts memory-intensively creates a bottleneck, as it transfers O(N) records from the database to Node.js.
**Action:** Always use `prisma.$queryRaw` with `COUNT(DISTINCT)` directly in the database for distinct count aggregations to reduce network roundtrips and avoid Node.js memory limits.
