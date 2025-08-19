import { env } from "@/env";
import { createClerkClient } from "@clerk/backend";

export const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
