import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// drizzle-kit does not auto-load env files; load .env.local explicitly.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
