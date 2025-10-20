import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/env";
import * as schema from "./schema";

import { createClient } from "@libsql/client";

export const client = createClient({
  url: env.TURSO_DB_URL,
  authToken: env.TURSO_DB_TOKEN,
});

export const db = drizzle({
  client,
  schema: schema,
});
