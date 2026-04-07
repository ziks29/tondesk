## 2024-05-17 - Parallelizing DB Operations
**Learning:** Sequential Prisma queries that are completely independent (like fetching user profile data and counting related records that aren't strictly connected to the immediate user object's relationships) can block the Next.js API thread unnecessarily, adding significant latency per request.
**Action:** Use `Promise.all()` to fetch independent data sources concurrently where it does not compromise sequential logic like webhook signature checks.
