## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-19 - Efficient Distinct Counts in Prisma
**Learning:** Using `prisma.interaction.groupBy` to fetch a large number of distinct groupings (like `botId` and `chatId`) transfers thousands of rows into Node.js memory just to compute lengths locally. This creates a severe memory and serialization bottleneck.
**Action:** To calculate distinct counts efficiently and avoid Node.js memory bottlenecks, use `prisma.$queryRaw` with `COUNT(DISTINCT)` directly in the database rather than fetching and looping over large datasets grouped with `prisma.interaction.groupBy`. Cast `BigInt` count results to `Number` to preserve compatibility with the rest of the application.
