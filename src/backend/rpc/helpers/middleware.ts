import { auth, currentUser } from "@clerk/nextjs/server";
import { actionClient } from "./safe-action";
import { getUsersOrganizationIdCached } from "@/backend/data/organization";
import { getSubTier } from "../utils/get-sub-tier";

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const orgId = await getUsersOrganizationIdCached(userId);

  return next({ ctx: { userId, orgId } });
});

export const authenticatedWithUserActionClient = actionClient.use(
  async ({ next }) => {
    const user = await currentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const orgId = await getUsersOrganizationIdCached(user.id);

    return next({ ctx: { user: user, userId: user.id, orgId } });
  }
);

export const organizationActionClient = authenticatedActionClient.use(
  async ({ next, ctx: { orgId } }) => {
    if (!orgId) {
      throw new Error("Unauthorized");
    }

    return next({ ctx: { orgId } });
  }
);

export const subscribedActionClient = authenticatedActionClient.use(
  async ({ next, ctx: { userId } }) => {
    const subTier = await getSubTier(userId);

    if (subTier !== "Free") {
      throw new Error("Unauthorized");
    }

    return next({ ctx: { subTier } });
  }
);
