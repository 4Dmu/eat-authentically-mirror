import { env } from "@/env";
import { createClerkClient } from "@clerk/backend";
import { type } from "arktype";

export const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
