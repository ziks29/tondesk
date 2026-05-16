## 2024-05-18 - Concurrent Content Extraction for Telegram Bot Deployment
**Learning:** During the deployment of a new Telegram bot (`src/app/api/bots/deploy/route.ts`), extracting content from user-provided URLs and files was performed sequentially using `for...of` loops. This created a performance bottleneck where I/O wait times accumulated O(N) rather than processing concurrently.
**Action:** When performing independent I/O operations (like fetching multiple URLs or reading multiple files) in backend API routes, always use `Promise.all()` to map them into an array of concurrent promises. This reduces latency from the sum of all operations to the latency of the slowest single operation.

## 2024-05-24 - Bounded Concurrent Link Extraction
**Learning:** While Promise.all() is great for concurrent I/O, unbounded concurrency during recursive web scraping can exhaust resources or hit rate limits. It is safe to parallelize recursive link extraction because state.pageCount increments synchronously before network requests.
**Action:** Use bounded concurrent processing (e.g., EXTRACTION_CHUNK_SIZE = 4) for recursive operations like link extraction. This provides a balance between parallel speedup and resource safety, minimizing latency while respecting crawl limits.
