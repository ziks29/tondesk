## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-18 - Concurrent Database Queries in Backend Routes
**Learning:** Sequential non-dependent database queries (like `findUnique` followed by `count`, or separate `$queryRaw` and `groupBy` operations) create accumulated latency that scales linearly with the number of queries.
**Action:** When performing multiple independent database queries in a single API route, always map them into an array of concurrent promises using `Promise.all()` or `prisma.$transaction()`. This executes them in parallel, reducing the total network roundtrip time and minimizing overall request latency.
