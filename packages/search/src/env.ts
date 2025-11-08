import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    TYPESENSE_HOST: z.string().min(1),
    TYPESENSE_PORT: z.coerce.number(),
    TYPESENSE_PROTOCOL: z.string().min(1),
    TYPESENSE_APIKEY: z.string().min(1),
  },
  runtimeEnv: process.env,
});
