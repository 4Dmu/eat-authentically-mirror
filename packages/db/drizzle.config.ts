import { defineConfig } from "drizzle-kit";
import { env } from "./src/env";

export default defineConfig({
  dialect: "turso", // 'mysql' | 'sqlite' | 'turso'
  schema: "./src/schema.ts",
  dbCredentials: {
    url: env.TURSO_DB_URL,
    authToken: env.TURSO_DB_TOKEN,
  },
});
