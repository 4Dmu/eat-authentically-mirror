import { env } from "@/env";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

import { createClient } from "@libsql/client";

export const client = createClient({
  url: env.NEW_TURSO_DB_URL,
  authToken: env.NEW_TURSO_DB_TOKEN,
});

export const newDb = drizzle({
  client: client,
  schema: schema,
});
