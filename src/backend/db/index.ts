import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/env";
import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: env.TURSO_DB_URL,
    authToken: env.TURSO_DB_TOKEN,
  },
  schema: schema,
});
