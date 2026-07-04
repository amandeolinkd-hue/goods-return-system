# LD Silk Mills — Goods Return System

Two-office goods-return workflow (Kalbadevi entry → Bhiwandi receiving → reporting),
built with Next.js 16, Neon Postgres, Drizzle ORM, and Auth.js. Replaces the original
Google Apps Script + Sheets system.

## Tech stack

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **Neon** serverless Postgres via **Drizzle ORM**
- **Auth.js v5** credentials login with role-based access (admin / kalbadevi / bhiwandi)
- **Vercel Blob** for attachments
- **Tailwind CSS 4** + lucide-react + sonner

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:migrate           # apply the schema to Neon
npm run db:seed              # create the initial admin user
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.local`)

| Var | What |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `AUTH_SECRET` | Session secret (`npx auth secret`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (for attachments) |

## Useful scripts

| Script | Purpose |
|---|---|
| `npm run db:generate` / `db:migrate` | Generate / apply Drizzle migrations |
| `npm run db:seed` | Seed the initial admin user |
| `npm run seed:users` | Seed test users for each role |
| `npm run csv:inspect` | Inspect CSVs in `data/` before importing |
| `npm run db:import` | Migrate the Google Sheets CSVs into Neon (`-- --dry` to preview) |
| `npm run db:reset-data` | Clear all returns + master data (keeps users) |

## Roles

- **admin** — full access, user & master-data management
- **kalbadevi** — create / edit returns
- **bhiwandi** — receiving queue (mark received + charges)

## Deployment (Vercel)

1. Import this repo on vercel.com.
2. Add env vars: `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `AUTH_TRUST_HOST=true`.
3. Create a **Vercel Blob** store and connect it to the project (provides `BLOB_READ_WRITE_TOKEN`).
4. Deploy. The app uses the same Neon database, which already holds the migrated data.
