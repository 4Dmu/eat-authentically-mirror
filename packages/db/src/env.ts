import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    TURSO_DB_URL: z.string().min(1),
    TURSO_DB_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
});
