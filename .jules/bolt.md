## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-18 - Avoid Node.js memory bottlenecks with distinct counts
**Learning:** Using `prisma.interaction.groupBy` to fetch a list of unique group combinations (e.g., `botId` and `chatId`) and counting them in Node.js can cause severe memory and processing bottlenecks when tables grow large, as every unique group row must be serialized and returned over the network.
**Action:** Always use `prisma.$queryRaw` with `COUNT(DISTINCT "column")` directly in the database when calculating distinct counts over relations, using `Prisma.join(array)` for IN clauses and `Number(result.count)` to handle BigInts.
