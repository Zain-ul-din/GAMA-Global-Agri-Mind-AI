import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";

if (!process.env.DB_FILE_NAME) {
  throw new Error("DB_FILE_NAME is not set (expected e.g. file:local.db)");
}

export const db = drizzle({
  connection: {
    url: process.env.DB_FILE_NAME,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
