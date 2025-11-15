import { createClerkClient } from "@clerk/backend";
import { env } from "@/env";

export const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
