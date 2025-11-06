import { env } from "@/env";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: env.ADMIN_TURSO_DB_URL,
    authToken: env.ADMIN_TURSO_DB_TOKEN,
  },
  schema: schema,
});
