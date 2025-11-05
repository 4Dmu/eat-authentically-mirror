import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    ORGANIZATION_PRO_MONTHLY_PRICE_ID: z.string().min(1),
    ORGANIZATION_PRO_YEARLY_PRICE_ID: z.string().min(1),
    ORGANIZATION_PREMIUM_MONTHLY_PRICE_ID: z.string().min(1),
    ORGANIZATION_PREMIUM_YEARLY_PRICE_ID: z.string().min(1),

    PRODUCER_ENTERPRISE_MONTHLY_PRICE_ID: z.string().min(1),
    PRODUCER_ENTERPRISE_YEARLY_PRICE_ID: z.string().min(1),

    COMMUNITY_MEMBER_MONTHLY_PRICE_ID: z.string().min(1),
    COMMUNITY_MEMBER_YEARLY_PRICE_ID: z.string().min(1),
  },
  runtimeEnv: process.env,
});
