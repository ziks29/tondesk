## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.
## 2024-05-19 - Concurrent Database Queries in Backend Routes
**Learning:** During the optimization of the `/api/user/wallet` endpoint, independent database queries (`prisma.user.upsert` and `prisma.bot.count`) were being executed sequentially, compounding latency.
**Action:** Always identify independent database operations and execute them concurrently using `Promise.all` (or `prisma.$transaction` if transactional safety is required) to reduce overall response time.
