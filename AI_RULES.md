# VJ-Shopping-World: AI Engineering Guidelines & Architecture Rules

### 1. General Standards
- Use TypeScript with strict mode enabled. `any` is strictly prohibited.
- Always use async/await with explicit error handling.
- Never write hardcoded secrets, API keys, or ports; use `process.env`.

### 2. Database & State Invariants
- PostgreSQL (Prisma): All financial updates MUST be wrapped in `prisma.$transaction()`.
- Money values must ALWAYS be represented as integers in Paise (e.g., ₹100.50 -> 10050). No floats.
- MongoDB: Treat schemas as immutable versioned documents; always specify explicit indexes.
- Redis: Use explicit TTLs on all temporary keys. Use Lua scripts for multi-step atomic operations.

### 3. API Security & Input Hygiene
- Validate 100% of incoming request bodies, queries, and headers using Zod schemas with `.strict()`.
- Never trust client-supplied prices, totals, or discount calculations. Recalculate on the server.
- Webhooks (Razorpay/Cashfree) must explicitly verify HMAC SHA256 signatures before processing.

### 4. Output Formatting
- Generate complete, runnable files. Do not truncate code with `// TODO: add other fields here`.
- Provide corresponding Vitest unit tests for critical business and financial logic.
