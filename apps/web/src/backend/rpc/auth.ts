"use server";
import { auth } from "@clerk/nextjs/server";
import { actionClient } from "./helpers/safe-action";
import { USER_DATA_KV } from "../kv";
import { getSubTier, SubTier } from "./utils/get-sub-tier";
import { getUsersProducerIdsCached } from "../data/producer";

export const fetchSubTier = actionClient
  .name("fetchSubTier")
  .action(async (): Promise<SubTier> => {
    return await getSubTier();
  });

export const fetchUser = actionClient.name("fetchUser").action(async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const userData = await USER_DATA_KV.get(userId);

  return userData;
});

export const getLoggedInUserProducerIds = actionClient
  .name("getLoggedInUserProducerIds")
  .action(async () => {
    const { userId } = await auth();

    if (!userId) {
      return [];
    }

    return await getUsersProducerIdsCached(userId);
  });
