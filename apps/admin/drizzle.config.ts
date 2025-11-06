import { env } from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema/index.ts",
  dbCredentials: {
    url: env.TURSO_DB_URL,
    authToken: env.TURSO_DB_TOKEN,
  },
});
