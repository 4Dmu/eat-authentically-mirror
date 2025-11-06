import { env } from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema/index.ts",
  dbCredentials: {
    url: env.ADMIN_TURSO_DB_TOKEN,
    authToken: env.ADMIN_TURSO_DB_TOKEN,
  },
});
