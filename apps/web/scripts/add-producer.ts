import { cloudflare } from "@/backend/lib/cloudflare";
import { env } from "@/env";
import { db } from "@ea/db";
import {
  mediaAssets,
  producerContact,
  producerLocation,
  producerMedia,
  producers,
  producerSocial,
  producersSearch,
} from "@ea/db/schema";
import { encode } from "ngeohash";

async function main() {
  const result = await cloudflare.images.v1.create({
    account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
    url: "https://www.quinta-da-fornalha.com/wp-content/uploads/2022/10/120199251_3384799034945418_3803152627820427332_n.webp",
  });

  //   const result = { id: "6c84f693-87d8-4092-51de-2bd5e6e5f900" };

  console.log(result);

  await db.transaction(async (tx) => {
    const assetId = crypto.randomUUID();
    await tx.insert(mediaAssets).values({
      id: assetId,
      uploadedByType: "system",
      contentType: "image/*",
      url: `https://imagedelivery.net/${env.SAFE_CLOUDFLARE_ACCOUNT_HASH}/${result.id}/public`,
      cloudflareId: result.id,
      storage: "cloudflare",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const id = crypto.randomUUID();
    await tx.insert(producers).values({
      id: id,
      type: "farm",
      name: "Quinta Da Fornalha",
      summary:
        "Nestled between a natural reserve that is home to pink flamingos, the historic town of Castro Marim and the endless sandy beaches of the Algarve lies our active traditional farm, surrounded by 12 hectares of organic Mediterranean orchards with figs, oranges, olives and carob trees. With ecotourism, volunteering, and collaboration opportunities available all year round, we welcome you to visit, stay, or work with us!",
      about:
        "Nestled between a natural reserve that is home to pink flamingos, the historic town of Castro Marim and the endless sandy beaches of the Algarve lies our active traditional farm, surrounded by 12 hectares of organic Mediterranean orchards with figs, oranges, olives and carob trees. With ecotourism, volunteering, and collaboration opportunities available all year round, we welcome you to visit, stay, or work with us!",
      createdAt: new Date(),
      updatedAt: new Date(),
      subscriptionRank: 0,
      verified: true,
    });

    await tx.insert(producersSearch).values({
      producerId: id,
      searchName: "Quinta Da Fornalha",
      searchSummary:
        "Nestled between a natural reserve that is home to pink flamingos, the historic town of Castro Marim and the endless sandy beaches of the Algarve lies our active traditional farm, surrounded by 12 hectares of organic Mediterranean orchards with figs, oranges, olives and carob trees. With ecotourism, volunteering, and collaboration opportunities available all year round, we welcome you to visit, stay, or work with us!",
    });

    await tx.insert(producerContact).values({
      producerId: id,
      email: "geral@quinta-da-fornalha.com",
      phone: "+351917107147",
      websiteUrl: "https://www.quinta-da-fornalha.com",
    });

    await tx.insert(producerSocial).values({
      producerId: id,
      instagram: "https://www.instagram.com/quintadafornalha/",
      facebook:
        "https://www.facebook.com/aquiestamosprontosparacultivarofuturo/",
    });

    await tx.insert(producerLocation).values({
      producerId: id,
      locality: "Quinta da Fornalha",
      country: "prt",
      adminArea: "Faro",
      city: "Castro Marim",
      postcode: "8950-186",
      latitude: 37.1987381,
      longitude: -7.4840981,
      geohash: encode(37.1987381, -7.4840981),
    });

    await tx.insert(producerMedia).values({
      assetId: assetId,
      producerId: id,
      role: "cover",
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
}

main();
