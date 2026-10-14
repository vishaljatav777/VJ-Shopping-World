# Base44 Setup Notes — VJ Express

## Architecture
- **Frontend**: React + Vite + Tailwind v4, served on port 5173 (mapped to host 3000).
- **Backend**: Node.js + Express + TypeScript, served on port 5000 (mapped to host 8000).
- **Database**: MySQL 8 (Prisma ORM, `provider = "mysql"` in `backend/prisma/schema.prisma`).
- **Redis**: NOT a real Redis — backend uses an in-memory `InMemoryRedisClient` class defined in `backend/src/index.ts`.
- **MongoDB**: NOT used anywhere in the code despite README mentions.

## Key Details
- The repo's own `docker-compose.yml` uses PostgreSQL, but the Prisma schema requires **MySQL**. The Base44 compose (`docker-compose.base44.yml`) uses MySQL 8 instead.
- No Prisma migrations exist — `prisma db push` syncs the schema at container startup.
- The seed script (`backend/src/seed.ts`) was missing the `sampleProducts` array definition; it has been added.
- Cloudinary credentials have hardcoded fallbacks in `backend/src/utils/cloudinary.ts`. Image upload falls back to Data URLs if Cloudinary fails. No external credentials needed for the app to function.
- `JWT_SECRET` has a fallback default in code; a dev value is set in compose.
- Frontend API URL is configured via `VITE_API_BASE_URL` env var pointing to the public backend URL (`https://8000-$BASE44_PUBLIC_HOST_SUFFIX/api`).

## Demo Accounts (seeded)
- **Buyer**: phone `9876543210`, password `Password123!`
- **Merchant**: phone `9876543211`, password `Password123!`
- **Rider**: phone `9876543212`, password `Password123!`

## Verification
- Frontend: `curl http://localhost:3000/` should return the Vite app HTML.
- Backend health: `curl http://localhost:8000/api/health` should return `{"status":"ok",...}`.
- Products: `curl http://localhost:8000/api/products` should return seeded products.
