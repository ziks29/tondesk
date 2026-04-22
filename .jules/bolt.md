## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-04-22 - Parallelize independent Prisma queries in API routes
**Learning:** Sequential, independent database queries (like `user.upsert` and `bot.count`) in API routes block on each other unnecessarily and contribute to higher total response latency.
**Action:** When executing independent database operations in API routes, always use `Promise.all()` to execute them concurrently, minimizing network/DB latency.
