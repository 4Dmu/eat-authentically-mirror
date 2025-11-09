import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "NEXT_PUBLIC",
  server: {
    TYPESENSE_APIKEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_TYPESENSE_HOST: z.string().min(1),
    NEXT_PUBLIC_TYPESENSE_PORT: z.coerce.number(),
    NEXT_PUBLIC_TYPESENSE_PROTOCOL: z.string().min(1),
    NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_APIKEY: z.string().min(1),
  },
  runtimeEnv: {
    TYPESENSE_APIKEY: process.env.TYPESENSE_APIKEY,
    NEXT_PUBLIC_TYPESENSE_HOST: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
    NEXT_PUBLIC_TYPESENSE_PORT: process.env.NEXT_PUBLIC_TYPESENSE_PORT,
    NEXT_PUBLIC_TYPESENSE_PROTOCOL: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL,
    NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_APIKEY:
      process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_APIKEY,
  },
});
