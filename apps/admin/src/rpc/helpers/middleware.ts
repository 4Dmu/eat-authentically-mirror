import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { actionClient } from "./safe-action";

export const authenticatedActionClient = actionClient.use(async () => {
  const headrs = await headers();
  const session = await auth.api.getSession({
    headers: headrs,
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return { headers: headrs, session };
});
