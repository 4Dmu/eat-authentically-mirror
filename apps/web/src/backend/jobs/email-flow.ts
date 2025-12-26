// Every 24 hours

import { db } from "@ea/db";

import {
  claimInvitations,
  producerContact,
  producerOutreachEmailState,
  producers,
} from "@ea/db/schema";
import { addDays } from "date-fns";
import { and, asc, eq, isNotNull, isNull, lt, lte, sql } from "drizzle-orm";
import { resend } from "../lib/resend";
import { generateToken } from "@ea/shared/generate-tokens";
import { env } from "@/env";

/* Based on a cursor starting at 0 select 100 people
    Day 1:
    people 0-100

    Day 2:
    people 100-200
*/

// Loop over each person and check status
// If not sent yet send first email

export async function runEmailFlow() {
  const today = new Date();

  const followUps = await db
    .select({
      producerId: producerContact.producerId,
      userId: producers.userId,
      claimInvitationToken: sql<string>`${claimInvitations.claimToken}`,
      claimInvitationStatus: claimInvitations.status,
      email: sql<string>`${producerContact.email}`,
      emailStep: producerOutreachEmailState.emailStep,
      lastEmailSent: producerOutreachEmailState.lastEmailSent,
      nextEmailAt: producerOutreachEmailState.nextEmailAt,
      metadata: producerOutreachEmailState.metadata,
    })
    .from(producerOutreachEmailState)
    .innerJoin(
      producerContact,
      eq(producerContact.producerId, producerOutreachEmailState.producerId)
    )
    .innerJoin(
      producers,
      eq(producers.id, producerOutreachEmailState.producerId)
    )
    .innerJoin(
      claimInvitations,
      eq(claimInvitations.producerId, producerOutreachEmailState.producerId)
    )
    .where(
      and(
        isNotNull(producerContact.email),
        lte(producerOutreachEmailState.nextEmailAt, today),
        lt(producerOutreachEmailState.emailStep, 5),
        isNull(producerOutreachEmailState.claimedAt)
      )
    )
    .orderBy(asc(producerOutreachEmailState.nextEmailAt))
    .limit(76);

  const newProducers = await db
    .select({
      producerId: producerContact.producerId,
      email: sql<string>`${producerContact.email}`,
      userId: producers.userId,
      claimInvitationToken: claimInvitations.claimToken,
      claimInvitationStatus: claimInvitations.status,
      emailStep: sql<null>`NULL`,
      lastEmailSent: sql<null>`NULL`,
      nextEmailAt: sql<null>`NULL`,
      metadata: sql<null>`NULL`,
    })
    .from(producerContact)
    .leftJoin(
      producerOutreachEmailState,
      eq(producerContact.producerId, producerOutreachEmailState.producerId)
    )
    .innerJoin(producers, eq(producers.id, producerContact.producerId))
    .leftJoin(
      claimInvitations,
      eq(claimInvitations.producerId, producerContact.producerId)
    )
    .where(
      and(
        isNotNull(producerContact.email),
        isNull(producerOutreachEmailState.producerId),
        isNull(producers.userId) // Ignore claimed users
      )
    )
    .orderBy(asc(producers.createdAt)) // or id
    .limit(19);

  const producersToProcess = [...followUps, ...newProducers];

  for (const producer of producersToProcess) {
    // User was claimed so stop email flow
    if (producer.userId !== null) {
      await db
        .update(producerOutreachEmailState)
        .set({
          claimedAt: new Date(),
        })
        .where(
          and(eq(producerOutreachEmailState.producerId, producer.producerId))
        );
    }
    // New User receiving first email
    else if (producer.emailStep === null) {
      let claimUrl: string;

      // Create claim invitation if it does'nt exist
      if (producer.claimInvitationToken === null) {
        const token = generateToken();
        const id = crypto.randomUUID();

        const expiresAt = addDays(new Date(), 30);

        await db.insert(claimInvitations).values({
          id,
          producerId: producer.producerId,
          status: {
            type: "waiting",
          },
          expiresAt,
          claimerEmail: producer.email,
          claimToken: token,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        claimUrl = `${env.SITE_URL}/join-and-claim?token=${token}`;
      } else {
        claimUrl = `${env.SITE_URL}/join-and-claim?token=${producer.claimInvitationToken}`;
      }

      const emailId = await sendEmail(producer, 1, claimUrl);
      await db.insert(producerOutreachEmailState).values({
        producerId: producer.producerId,
        emailStep: 1,
        lastEmailSent: today,
        nextEmailAt: addDays(today, 7),
        createdAt: today,
        updatedAt: today,
        metadata: {
          runEmailIds: [emailId],
        },
      });
    }
    // Follow up emails
    else if (producer.emailStep < 5) {
      const claimUrl = `${env.SITE_URL}/join-and-claim?token=${producer.claimInvitationToken}`;
      const nextStep = producer.emailStep + 1;

      const updates = await db
        .update(producerOutreachEmailState)
        .set({
          emailStep: nextStep,
          lastEmailSent: today,
          nextEmailAt: nextStep < 5 ? addDays(today, 7) : null,
          completedAt: nextStep < 5 ? null : today,
          updatedAt: today,
        })
        .where(
          and(
            eq(producerOutreachEmailState.producerId, producer.producerId),
            eq(producerOutreachEmailState.emailStep, producer.emailStep)
          )
        );

      if (updates.rowsAffected > 0) {
        const emailId = await sendEmail(producer, nextStep, claimUrl);
        await db
          .update(producerOutreachEmailState)
          .set({
            metadata: producer.metadata
              ? {
                  ...producer.metadata,
                  runEmailIds: [...producer.metadata.runEmailIds, emailId],
                }
              : { runEmailIds: [emailId] },
          })
          .where(
            and(eq(producerOutreachEmailState.producerId, producer.producerId))
          );
      }
    }
  }
}

async function sendEmail(
  producer: { producerId: string; email: string },
  step: number,
  claimUrl: string
) {
  console.log(producer.email, step, claimUrl);

  const result = await resend.emails.send({
    from: "Eat Authentically <hello@eatauthentically.app>",
    to: producer.email,
    // @ts-expect-error
    template: {
      id:
        step === 1
          ? "a4481b94-9b07-4d1e-a2bb-d3359976e676"
          : step === 2
            ? "0b67294b-6f4d-4b6e-b1e2-a72223008db2"
            : step === 3
              ? "f7d9ff0c-1617-479e-94db-d4d10fe949ab"
              : step === 4
                ? "34e721fe-77d1-4973-acc0-e041a323249a"
                : "51a7d4d8-fee8-416b-b82a-0e9d0fc1c3eb",
      variables: { claimLink: claimUrl },
    },
  });

  return result.data?.id!;
}
