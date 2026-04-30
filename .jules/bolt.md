## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.
## 2025-02-27 - Optimize distinct counts to prevent memory bloat
**Learning:** Using `prisma.interaction.groupBy` for distinct counting forces Prisma to fetch every single grouped row (all chat IDs for all bots) into Node.js memory. This causes massive memory consumption and slow data transfer for bots with many users.
**Action:** Use `prisma.$queryRaw` with `COUNT(DISTINCT)` to offload the counting to the database directly. Always cast the resulting `bigint` counts to `Number()`.
