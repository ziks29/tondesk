## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-04-28 - Optimizing Grouped Distinct Counts in Prisma
**Learning:** `prisma.interaction.groupBy` returns an array of unique combination rows (e.g., grouping by botId and chatId returns every distinct user per bot). For counting distinct users across many bots, pulling all these rows into Node.js memory just to aggregate them causes severe performance and memory bottlenecks (O(N) data transfer and computation).
**Action:** Always replace memory-intensive Prisma `groupBy` enumerations with a raw SQL query `prisma.$queryRaw` using `COUNT(DISTINCT column) GROUP BY id`. Remember to parameterize safely with `${Prisma.join(array)}` and cast the `BigInt` result to `Number`.
