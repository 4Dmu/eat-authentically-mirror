// import { db } from "@/backend/db";
// import { BusinessHours, ProducerInsert, producers } from "@/backend/db/schema";
// import { Address } from "@/backend/validators/producers";
// import { env } from "@/env";
// import { countryByName } from "@/utils/contries";
// import { readdir, readFile, writeFile } from "node:fs/promises";
// import { match } from "ts-pattern";
// import { nanoid } from "nanoid";
// import { eq } from "drizzle-orm";

// async function main() {
//   const json = await readFile("./scripts/import/michelin.json", "utf8");
//   const items = JSON.parse(json) as Listing[];
//   //   const images = await readdir("./scripts/import/images");

//   await db.transaction(async (tx) => {
//     for (const item of items) {
//       const parts = item.address.split(",");

//       const lastIndex = parts.length - 1;
//       let cn = parts[lastIndex].trim();

//       const address: Address = {};

//       for (let i = 0; i < lastIndex; i++) {
//         address[
//           match(i)
//             .with(0, () => "street" as const)
//             .with(1, () => "city" as const)
//             .with(2, () => "zip" as const)
//             .otherwise(() => "street" as const)
//         ] = parts[i].trim();
//       }

//       if (cn === "United Kingdom") {
//         cn = "United Kingdom of Great Britain and Northern Ireland";
//       }
//       const name = countryByName(cn);
//       address.country = name.alpha3;
//       address.coordinate = {
//         latitude: Number(item.location.geo.lat),
//         longitude: Number(item.location.geo.lng),
//       };

//       const hours: BusinessHours = {};

//       for (const hour of item.hours) {
//         hours[
//           match(hour.day)
//             .with("Monday", () => "mon" as const)
//             .with("Tuesday", () => "tue" as const)
//             .with("Wednesday", () => "wed" as const)
//             .with("Thursday", () => "thu" as const)
//             .with("Friday", () => "fri" as const)
//             .with("Saturday", () => "sat" as const)
//             .otherwise(() => "sun" as const)
//         ] = {
//           open: hour.open,
//           close: hour.close,
//         };
//       }

//       await tx.insert(producers).values({
//         id: item.id,
//         name: item.name,
//         type: "eatery",
//         claimed: false,
//         verified: false,
//         about: item.description,
//         commodities: [],
//         address: address,
//         contact: {
//           phone: item.phone,
//           website: item.website,
//         },
//         socialMedia: {
//           facebook: null,
//           twitter: null,
//           instagram: null,
//         },
//         scrapeMeta: {
//           _metaType: "michelin",
//         },
//         images: {
//           items: [],
//           primaryImgId: null,
//         },
//         hours: hours,
//         subscriptionRank: 0,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       } satisfies ProducerInsert);
//     }
//   });
// }

// async function images() {
//   const json = await readFile("./scripts/import/michelin.json", "utf8");
//   const items = JSON.parse(json) as Listing[];
//   const images = await readdir("./scripts/import/images");

//   const tokenResponse = await fetch(
//     `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v1/batch_token`,
//     {
//       headers: {
//         Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
//       },
//     }
//   );

//   const tokenBody = (await tokenResponse.json()) as {
//     result: {
//       token: string;
//       expiresAt: string;
//     };
//     success: boolean;
//     errors: unknown[];
//     messages: unknown[];
//   };

//   if (!tokenBody.success) {
//     console.error(tokenBody);
//     throw new Error("Error creating batch upload token");
//   }

//   const made: { name: string; id: string }[] = await readFile(
//     "./scripts/import/uploaded.json",
//     "utf8"
//   ).then((r) => JSON.parse(r));

//   for (const listing of items) {
//     const imagesForListing = images.filter((img) => img.startsWith(listing.id));
//     const newImages = [];

//     if (imagesForListing.every((i) => made.some((r) => r.name === i))) {
//       console.log("skipping", listing.id);
//       continue;
//     }

//     for (const image of imagesForListing) {
//       const existing = made.find((m) => m.name === image);
//       if (existing) {
//         newImages.push({
//           _type: "cloudflare" as const,
//           cloudflareId: existing.id,
//           cloudflareUrl: `https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/${existing.id}/public`,
//           alt: `${listing.name} image`,
//         });
//         continue;
//       }
//       const newImageId = `michelin.scraped.${nanoid()}`;

//       const formData = new FormData();

//       formData.set("id", newImageId);
//       formData.set("creator", listing.id);
//       const file = await readFile(`./scripts/import/images/${image}`);
//       const blob = new Blob([file as BlobPart]);

//       if (blob.size > 20000000) {
//         continue;
//       }

//       formData.set("file", blob);
//       formData.set(
//         "metadata",
//         JSON.stringify({
//           producerId: listing.id,
//         })
//       );

//       const response = await fetch(
//         "https://batch.imagedelivery.net/images/v1",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${tokenBody.result.token}`,
//           },
//           body: formData,
//         }
//       );

//       const body = (await response.json()) as { success: boolean };

//       if (!body.success) {
//         console.log(body);
//         throw new Error("Error uploading image");
//       }

//       made.push({ name: image, id: newImageId });
//       await writeFile("./scripts/import/uploaded.json", JSON.stringify(made));

//       console.log(body);

//       newImages.push({
//         _type: "cloudflare" as const,
//         cloudflareId: newImageId,
//         cloudflareUrl: `https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/${newImageId}/public`,
//         alt: `${listing.name} image`,
//       });
//     }

//     console.log(listing.id);

//     await db
//       .update(producers)
//       .set({
//         images: {
//           items: newImages,
//           primaryImgId: newImages[0]?.cloudflareId,
//         },
//       })
//       .where(eq(producers.id, listing.id));
//   }
// }

// images();

// export type Listing = {
//   id: string;
//   name: string;
//   description: string;
//   classifications: any[];
//   images: ImageElement[];
//   website: string;
//   phone: string;
//   address: string;
//   info: Info;
//   location: Location;
//   hours: Hour[];
// };

// export type Hour = {
//   day: string;
//   open: string;
//   close: string;
// };

// export type ImageElement = {
//   caption: string;
//   image: ImageImage;
// };

// export type ImageImage = {
//   src?: string;
//   alt: string;
//   srcset: string;
//   dataSrc: string;
//   ciSrc: string;
// };

// export type Info = {
//   priceness: string;
//   tags: string[];
// };

// export type Location = {
//   mapsUrl: string;
//   geo: Geo;
// };

// export type Geo = {
//   lat: number;
//   lng: number;
// };
