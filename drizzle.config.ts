import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // During local build/lint/test, DATABASE_URL might not be defined.
  // We can fallback to a dummy connection string to avoid errors.
  process.env.DATABASE_URL = "postgres://localhost:5432/dummy";
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
