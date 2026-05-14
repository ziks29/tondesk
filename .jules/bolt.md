## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-19 - Avoid Node.js Memory Bottlenecks in Distinct Counts
**Learning:** Calculating `COUNT(DISTINCT)` by utilizing `prisma.interaction.groupBy` pulls vast amounts of group records into Node.js memory just to compute unique array lengths.
**Action:** Always compute distinct counts natively in the database via `prisma.$queryRaw` with `COUNT(DISTINCT "field")` rather than fetching large grouped datasets to count them in Node.js.
