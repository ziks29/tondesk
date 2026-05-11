## 2024-05-18 - Database Aggregation over Node.js Processing
**Learning:** In `src/app/api/bots/list/route.ts`, counting distinct users per bot using `prisma.interaction.groupBy` pulled a record into memory for every unique `(botId, chatId)` tuple before counting them in Node.js. This creates a severe memory bottleneck and latency degradation as the dataset scales.
**Action:** Always use `prisma.$queryRaw` with `COUNT(DISTINCT column)` to push aggregation work down to the database level, ensuring only the aggregated scalar values are transferred and processed in the Node environment.
