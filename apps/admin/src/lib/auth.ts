import { db } from "@/db";
import { env } from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  plugins: [
    passkey({
      rpID: env.AUTH_PASSKEY_RP_ID,
      rpName: env.AUTH_PASSKEY_RP_NAME,
      origin: env.AUTH_PASSKEY_ORIGIN,
    }),
    nextCookies(),
  ],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
});
