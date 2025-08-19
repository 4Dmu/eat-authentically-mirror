import { eq } from "drizzle-orm";
import { db } from "../db";
import { organizations } from "../db/schema";
import { USER_ORG_ID_KV } from "../kv";

export async function getUsersOrganizationIdCached(userId: string) {
  const organizationId = await USER_ORG_ID_KV.get(userId);

  if (organizationId) {
    return organizationId;
  }

  const orgIdFromDb = await db.query.organizations
    .findFirst({
      columns: { id: true },
      where: eq(organizations.ownerUserId, userId),
    })
    .then((org) => org?.id);

  if (orgIdFromDb) {
    await USER_ORG_ID_KV.set(userId, orgIdFromDb);
    return orgIdFromDb;
  }

  return null;
}

export async function getUsersOrganizationId(userId: string) {
  const orgIdFromDb = await db.query.organizations
    .findFirst({
      columns: { id: true },
      where: eq(organizations.ownerUserId, userId),
    })
    .then((org) => org?.id);

  return orgIdFromDb;
}
