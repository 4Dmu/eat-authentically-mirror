// import { db } from "@ea/db";
// import {
//   BusinessHours,
//   ImportedReviewInsert,
//   importedReviews,
//   ProducerInsert,
//   producers,
// } from "@ea/db/schema";
// import { env } from "@/env";
// import { readFile, writeFile } from "node:fs/promises";
// import { nanoid } from "nanoid";
// import { eq } from "drizzle-orm";

// async function main() {
//   const listingJson = await readFile(
//     "./import/eat-well-guide-data/listings-with-maps-place-images.json",
//     "utf8"
//   );
//   const listings = (await JSON.parse(listingJson)) as Listing[];

//   await db.transaction(async (tx) => {
//     for (const listing of listings) {
//       const parts = listing.contact.address.split(",");
//       const hours: BusinessHours = {};

//       for (const hour of listing.hours) {
//         const times = hour.times.split("-");
//         hours[hour.day.toLowerCase() as "mon"] = {
//           open: times[0],
//           close: times[1],
//         };
//       }

//       await tx.insert(producers).values({
//         id: listing.id,
//         name: listing.name,
//         type: listing.categories[0] !== "RESTAURANTS" ? "farm" : "eatery",
//         claimed: false,
//         verified: false,
//         about: listing.about.join("\n"),
//         googleMapsPlaceDetails: listing.googleMapsPlace
//           ? {
//               id: listing.googleMapsPlace.id,
//               name: listing.googleMapsPlace.name,
//               googleMapsUri: listing.googleMapsPlace.googleMapsUri,
//               businessStatus: listing.googleMapsPlace.businessStatus,
//               types: listing.googleMapsPlace.types,
//               rating: listing.googleMapsPlace.rating,
//             }
//           : undefined,
//         commodities: [],
//         address: {
//           street: parts[0],
//           city: parts[1],
//           state: parts[2],
//           zip: parts[3],
//           country: "usa",
//           coordinate: {
//             latitude: Number(listing.map.geo.latitude),
//             longitude: Number(listing.map.geo.longitude),
//           },
//         },
//         contact: {
//           phone: listing.contact.phone,
//           website: listing.contact.website,
//         },
//         socialMedia: {
//           facebook: listing.contact.facebook,
//           twitter: listing.contact.twitter,
//           instagram: null,
//         },
//         scrapeMeta: {
//           _metaType: "eatwellguide",
//           details: listing.details,
//           categories: listing.categories,
//         },
//         images: {
//           items: [],
//           primaryImgId: null,
//         },
//         serviceDetails: listing.googleMapsPlace
//           ? {
//               takeout: listing.googleMapsPlace?.takeout ?? false,
//               delivery: listing.googleMapsPlace?.delivery ?? false,
//               dineIn: listing.googleMapsPlace?.dineIn ?? false,
//               reservable: listing.googleMapsPlace?.reservable ?? false,
//             }
//           : undefined,
//         hours: hours,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       } satisfies ProducerInsert);

//       if (
//         listing.googleMapsPlace &&
//         listing.googleMapsPlace.reviews &&
//         listing.googleMapsPlace.reviews.length > 0
//       ) {
//         await tx.insert(importedReviews).values(
//           listing.googleMapsPlace.reviews.map(
//             (r) =>
//               ({
//                 id: crypto.randomUUID(),
//                 rating: r.rating as 0,
//                 producerId: listing.id,
//                 data: {
//                   type: "google-maps",
//                   googleMapsReviewName: r.name,
//                   text: r.text,
//                   originalText: r.originalText,
//                   authorAttribution: r.authorAttribution,
//                   publishTime: r.publishTime,
//                   googleMapsUri: r.googleMapsUri,
//                 },
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//               }) satisfies ImportedReviewInsert
//           )
//         );
//       }
//     }
//   });
// }

// async function images() {
//   const listingJson = await readFile(
//     "./import/eat-well-guide-data/listings-with-maps-place-images.json",
//     "utf8"
//   );

//   const listings = (await JSON.parse(listingJson)) as Listing[];

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
//     "./import/eat-well-guide-data/uploaded.json",
//     "utf8"
//   ).then((r) => JSON.parse(r));

//   for (const listing of listings) {
//     const newImages = [];

//     if (listing.images.every((i) => made.some((r) => r.name === i))) {
//       console.log("skipping", listing.id);
//       continue;
//     }

//     for (const image of listing.images) {
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
//       const newImageId = `google.scraped.${nanoid()}`;

//       const formData = new FormData();

//       formData.set("id", newImageId);
//       formData.set("creator", listing.id);
//       const file = await readFile(`./import/eat-well-guide-data${image}`);
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
//       await writeFile(
//         "./import/eat-well-guide-data/uploaded.json",
//         JSON.stringify(made)
//       );

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
//   categories: string[];
//   about: string[];
//   contact: Contact;
//   map: Map;
//   hours: Hour[];
//   details: any[];
//   googleMapsPlace?: GoogleMapsPlace;
//   images: string[];
// };

// export type GoogleMapsPlace = {
//   name: string;
//   id: string;
//   types: string[];
//   rating: number;
//   googleMapsUri: string;
//   businessStatus: string;
//   displayName: DisplayName;
//   takeout?: boolean;
//   delivery?: boolean;
//   reservable?: boolean;
//   dineIn?: boolean;
//   reviews: Review[];
//   photos: Photo[];
// };

// export type DisplayName = {
//   text: string;
//   languageCode: LanguageCode;
// };

// export type LanguageCode = "en";

// export type Photo = {
//   name: string;
//   widthPx: number;
//   heightPx: number;
//   authorAttributions: AuthorAttribution[];
//   flagContentUri: string;
//   googleMapsUri: string;
// };

// export type AuthorAttribution = {
//   displayName: string;
//   uri: string;
//   photoUri: string;
// };

// export type Review = {
//   name: string;
//   relativePublishTimeDescription: string;
//   rating: number;
//   text: DisplayName;
//   originalText: DisplayName;
//   authorAttribution: AuthorAttribution;
//   publishTime: string;
//   flagContentUri: string;
//   googleMapsUri: string;
// };

// export type Contact = {
//   address: string;
//   phone: string;
//   facebook: string;
//   twitter: string;
//   website: string;
// };

// export type Detail = {
//   title: string;
//   content: string;
// };

// export type Hour = {
//   day: string;
//   times: string;
// };

// export type Map = {
//   address: string;
//   geo: Geo;
// };

// export type Geo = {
//   latitude: string;
//   longitude: string;
// };
