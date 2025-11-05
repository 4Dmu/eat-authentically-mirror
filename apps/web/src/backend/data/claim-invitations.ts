import { and, eq, sql } from "drizzle-orm";
import { db } from "@ea/db";
import { claimInvitations } from "@ea/db/schema";
import { isPast } from "date-fns";

export async function getValidClaimInvitationByToken(token: string) {
  const invitation = await db.query.claimInvitations.findFirst({
    where: and(
      eq(claimInvitations.claimToken, token),
      sql`json_extract(${claimInvitations.status}, '$.type') = 'waiting'`
    ),
  });

  if (!invitation) {
    return undefined;
  }

  if (isPast(invitation.expiresAt)) {
    await db
      .update(claimInvitations)
      .set({
        status: {
          expiredAt: new Date(),
          type: "expired",
        },
        updatedAt: new Date(),
      })
      .where(eq(claimInvitations.id, invitation.id));

    return undefined;
  }

  return invitation;
}
