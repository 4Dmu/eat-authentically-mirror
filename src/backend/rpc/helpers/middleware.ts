import { auth, currentUser } from "@clerk/nextjs/server";
import { actionClient } from "./safe-action";
import { getSubTier } from "../utils/get-sub-tier";
import { getUsersProducerIdsCached } from "@/backend/data/producer";

export const authenticatedActionClient = actionClient.use(async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const producerIds = await getUsersProducerIdsCached(userId);
  console.log(
    `[MIDDLEWARE authenticatedActionClient] userId: ${userId} - producerIds: ${producerIds}`,
  );

  return { userId, producerIds };
});

export const authenticatedWithUserActionClient = actionClient.use(async () => {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const producerIds = await getUsersProducerIdsCached(user.id);

  console.log(
    `[MIDDLEWARE authenticatedWithUserActionClient] user: ${user} - producerIds: ${producerIds}`,
  );

  return { user: user, userId: user.id, producerIds };
});

export const producerActionClient = authenticatedActionClient.use(
  async ({ producerIds }) => {
    if (producerIds.length < 1) {
      throw new Error("Unauthorized");
    }
    console.log(
      `[MIDDLEWARE producerActionClient] producerIds: ${producerIds}`,
    );
    return {};
  },
);

export const subscribedActionClient = authenticatedActionClient.use(
  async ({ userId }) => {
    const subTier = await getSubTier(userId);

    if (subTier !== "Free") {
      throw new Error("Unauthorized");
    }

    console.log(`[MIDDLEWARE subscribedActionClient] subTier: ${subTier}`);

    return { subTier };
  },
);
