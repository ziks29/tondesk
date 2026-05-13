## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-19 - Efficient Distinct Counts in Prisma
**Learning:** Using `prisma.interaction.groupBy` and iterating over results to count distinct records transfers large datasets to the Node.js process, leading to memory bottlenecks and high data transfer costs. Data transfer volume is a critical performance metric.
**Action:** Use `prisma.$queryRaw` with `COUNT(DISTINCT)` directly in the database (e.g., `SELECT "botId", COUNT(DISTINCT "chatId")`) to push the aggregation to the DB layer. When using `$queryRaw` for `IN` clauses, use `Prisma.join(array)` ensuring the array is not empty, and cast results to `Number()` to convert `BigInt`.
