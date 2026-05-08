## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-18 - Optimize unique distinct count queries via Raw SQL
**Learning:** In `src/app/api/bots/list/route.ts`, calculating unique users per bot using `prisma.interaction.groupBy` and subsequently looping in Node.js creates a memory bottleneck because it fetches the complete grouped dataset from the database.
**Action:** Use `prisma.$queryRaw` with `COUNT(DISTINCT "chatId")` and `GROUP BY "botId"` directly in the database to reduce data transfer and serialization latency. Always ensure `Prisma.join(array)` is used and the array is checked to not be empty for parameterized SQL inputs.
