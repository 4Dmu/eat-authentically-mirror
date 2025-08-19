import { auth } from "@clerk/nextjs/server";
import { actionClient } from "./safe-action";
import { getUsersOrganizationIdCached } from "@/backend/data/organization";
import { getMemberSubTier } from "../utils/get-sub-tier";

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const orgId = await getUsersOrganizationIdCached(userId);

  return next({ ctx: { userId, orgId } });
});

export const organizationActionClient = authenticatedActionClient.use(
  async ({ next, ctx: { orgId } }) => {
    if (!orgId) {
      throw new Error("Unauthorized");
    }

    return next({ ctx: { orgId } });
  }
);

export const membeSubedActionClient = authenticatedActionClient.use(
  async ({ next, ctx: { userId } }) => {
    const memberSubTier = await getMemberSubTier(userId);

    if (memberSubTier !== "Pro") {
      throw new Error("Unauthorized");
    }

    return next({ ctx: { memberSubTier } });
  }
);
