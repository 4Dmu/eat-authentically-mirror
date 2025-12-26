import { env } from "@/env";
import { db } from "@ea/db";
import {
  claimInvitations,
  producerContact,
  producerOutreachEmailState,
} from "@ea/db/schema";
import { generateToken } from "@ea/shared/generate-tokens";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";

async function main() {
  const json = await readFile("../../email-recipients.json", "utf8");
  const data = JSON.parse(json) as {
    email: string;
    message_id: string;
    sent_at: Date;
    status: string;
  }[];

  for (const item of data) {
    // find producer
    const producer = await db.query.producerContact.findFirst({
      where: eq(producerContact.email, item.email),
    });

    if (!producer || !producer.email) {
      continue;
    }

    const claimInvitation = await db.query.claimInvitations.findFirst({
      where: eq(claimInvitations.producerId, producer.producerId),
    });

    const today = new Date();
    if (!claimInvitation) {
      console.log("created claim invite");
      // create claim invitation
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
    }

    await db.insert(producerOutreachEmailState).values({
      producerId: producer.producerId,
      emailStep: 1,
      lastEmailSent: today,
      nextEmailAt: addDays(today, 7),
      createdAt: today,
      updatedAt: today,
      metadata: {
        runEmailIds: [item.message_id],
      },
    });

    console.log("processed", item.email);
  }
}

main();
