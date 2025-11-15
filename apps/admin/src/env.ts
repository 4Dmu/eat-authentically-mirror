import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ADMIN_TURSO_DB_URL: z.string().min(1),
    ADMIN_TURSO_DB_TOKEN: z.string().min(1),

    AUTH_PASSKEY_RP_ID: z.string().min(1),
    AUTH_PASSKEY_RP_NAME: z.string().min(1),
    AUTH_PASSKEY_ORIGIN: z.string().min(1),

    TURSO_DB_URL: z.string().min(1),
    TURSO_DB_TOKEN: z.string().min(1),

    SAFE_CLOUDFLARE_API_TOKEN: z.string().min(1),
    SAFE_CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    SAFE_CLOUDFLARE_ACCOUNT_HASH: z.string().min(1),

    ORGANIC_CERT_ID: z.string().min(1),

    CLERK_SECRET_KEY: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
});
