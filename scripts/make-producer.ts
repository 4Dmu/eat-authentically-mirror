import { db } from "@/backend/db";
import { producers } from "@/backend/db/schema";

async function main() {
  console.log(
    await db.insert(producers).values({
      id: crypto.randomUUID(),
      name: "Test Farm",
      type: "farm",
      claimed: false,
      verified: false,
      commodities: [],
      socialMedia: { twitter: null, facebook: null, instagram: null },
      images: {
        items: [],
        primaryImgId: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}

main();
