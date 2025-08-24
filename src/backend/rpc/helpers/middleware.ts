import { auth, currentUser } from "@clerk/nextjs/server";
import { actionClient } from "./safe-action";
import { getUsersOrganizationIdCached } from "@/backend/data/organization";
import { getSubTier } from "../utils/get-sub-tier";

export const authenticatedActionClient = actionClient.use(async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const orgId = await getUsersOrganizationIdCached(userId);

  return { userId, orgId };
});

export const authenticatedWithUserActionClient = actionClient.use(async () => {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const orgId = await getUsersOrganizationIdCached(user.id);

  return { user: user, userId: user.id, orgId };
});

export const organizationActionClient = authenticatedActionClient.use(
  async ({ orgId }) => {
    if (!orgId) {
      throw new Error("Unauthorized");
    }

    return { orgId };
  }
);

export const subscribedActionClient = authenticatedActionClient.use(
  async ({ userId }) => {
    const subTier = await getSubTier(userId);

    if (subTier !== "Free") {
      throw new Error("Unauthorized");
    }

    return { subTier };
  }
);
