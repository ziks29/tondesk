## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-18 - Optimize GroupBy Distinct Count Queries
**Learning:** Using `prisma.interaction.groupBy` to fetch distinct pairs of `botId` and `chatId` for multiple bots pulls all distinct groups into Node.js memory. This causes massive memory overhead and slow execution when calculating the distinct number of chats per bot across thousands of interactions.
**Action:** Replace `prisma.*.groupBy` with `prisma.$queryRaw` and `COUNT(DISTINCT column)` to execute the distinct count fully within the database, only returning the final count numbers to Node.js.
