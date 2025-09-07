import { db } from "@/backend/db";
import { producers } from "@/backend/db/schema";

async function main() {
  console.log(
    await db.insert(producers).values({
      id: crypto.randomUUID(),
      name: "Bridge Farm",
      type: "farm",
      claimed: false,
      verified: false,
      commodities: [],
      socialMedia: { twitter: null, facebook: null, instagram: null },
      contact: {
        website: "https://12dmu.com",
        phone: "+1 (321) 236-2162",
      },
      images: {
        items: [],
        primaryImgId: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
}

main();
