import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DB_FILE_NAME ?? "file:./local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
