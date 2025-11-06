// import { db } from "@ea/db";
// import {
//   certifications,
//   commodities,
//   commodityVariants,
//   mediaAssets,
//   producerCertifications,
//   producerCommodities,
//   producerContact,
//   producerLocation,
//   producerMedia,
//   producers,
//   producerSocial,
//   producersSearch,
// } from "@ea/db/schema";
// import { eq } from "drizzle-orm";
// import { readdir, readFile, writeFile } from "node:fs/promises";
// import * as ngeohash from "ngeohash";
// import * as z from "zod";
// import { env } from "@/env";
// import { GOOGLE_GEOCODE_RESPONSE_CACHE } from "@/backend/kv";
// import { GeocodeResponseSchema } from "@ea/validators/google-geocode-api";
// import { nanoid } from "nanoid";
// import mime from "mime-types";

// async function geocodeAddress(address: string) {
//   const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.GOOGLE_MAPS_API_KEY}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   const result = GeocodeResponseSchema.parse(data);

//   await GOOGLE_GEOCODE_RESPONSE_CACHE.set(address, result);

//   return result;
// }

// async function run() {
//   const imagesPath = "./scripts/real-organic/images";

//   async function getAllFiles(dir: string) {
//     const entries = await readdir(dir);
//     return entries.map((f) => `${dir}/${f}`);
//   }

//   const files = await getAllFiles(imagesPath);

//   const resultsPath = "./scripts/real-organic/results.json";

//   const results = JSON.parse(await readFile(resultsPath, "utf8")) as {
//     name: string;
//     about: string;
//     url: string;
//     socials: string[];
//     buyingOptions: {
//       "buy-online": true;
//       "ships-product": false;
//       "sell-wholesale": true;
//       "sell-csa": false;
//       "sell-at-farmers-market": false;
//       "onfarm-store": false;
//     };
//     certifiedProducts: string[];
//     email: string;
//     phone: string;
//     farmer: string;
//     address: string;
//     id: string;
//   }[];

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

//   const made: {
//     path: string;
//     id: string;
//     size: number;
//     contentType: string;
//   }[] = await readFile("./scripts/real-organic/made.json", "utf8").then((r) =>
//     JSON.parse(r)
//   );

//   const index: number = results.findIndex(
//     (r) => r.id === "9d326c87-95a5-47e3-8527-bb266f108323"
//   );

//   console.log(index);

//   for (const item of results.slice(index, results.length)) {
//     const imageFilesForItem = files.filter((f) => f.includes(item.id));
//     const images: {
//       _type: "cloudflare";
//       cloudflareId: string;
//       cloudflareUrl: string;
//       path: string;
//       alt: string;
//       size: number;
//       contentType: string;
//     }[] = [];

//     for (const imageFile of imageFilesForItem) {
//       const existing = made.find((m) => m.path === imageFile);
//       if (existing) {
//         images.push({
//           _type: "cloudflare" as const,
//           cloudflareId: existing.id,
//           cloudflareUrl: `https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/${existing.id}/public`,
//           alt: `${item.name} image`,
//           size: existing.size,
//           contentType: existing.contentType,
//           path: imageFile,
//         });
//         continue;
//       }
//       const newImageId = `realorganic.scraped.${nanoid()}`;

//       const formData = new FormData();

//       formData.set("id", newImageId);
//       formData.set("creator", item.id);
//       const file = await readFile(imageFile);
//       const blob = new Blob([file as BlobPart]);

//       if (blob.size > 20000000) {
//         continue;
//       }

//       formData.set("file", blob);
//       formData.set(
//         "metadata",
//         JSON.stringify({
//           producerId: item.id,
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

//       const contentType = mime.lookup(imageFile);

//       made.push({
//         path: imageFile,
//         id: newImageId,
//         size: blob.size,
//         contentType: contentType === false ? "image/*" : contentType,
//       });

//       await writeFile("./scripts/real-organic/made.json", JSON.stringify(made));

//       console.log(body);

//       images.push({
//         _type: "cloudflare" as const,
//         cloudflareId: newImageId,
//         cloudflareUrl: `https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/${newImageId}/public`,
//         alt: `${item.name} image`,
//         path: imageFile,
//         size: blob.size,
//         contentType: contentType === false ? "image/*" : contentType,
//       });
//     }

//     console.log(item.name, item.id);

//     await db.transaction(async (tx) => {
//       for (let i = 0; i < images.length; i++) {
//         const image = images[i];
//         const id = crypto.randomUUID();
//         await tx.insert(mediaAssets).values({
//           id: id,
//           uploadedByType: "system",
//           cloudflareId: image.cloudflareId,
//           url: image.cloudflareUrl,
//           origin: "web_scrape",
//           storage: "cloudflare",
//           contentType: image.contentType,
//           byteSize: image.size,
//           alt: image.alt,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         });

//         await tx.insert(producerMedia).values({
//           producerId: item.id,
//           assetId: id,
//           createdAt: new Date(),
//           position: i,
//           role: i === 0 ? "cover" : "gallery",
//           updatedAt: new Date(),
//         });
//       }
//       // await tx
//       //   .update(producers)
//       //   .set({
//       //     images: {
//       //       items: newImages,
//       //       primaryImgId: newImages[0]?.cloudflareId,
//       //     },
//       //   })
//       //   .where(eq(producers.id, listing.id));
//     });

//     // await new Promise((r) => setTimeout(r, 5000));
//     // await db.transaction(async (tx) => {
//     //   console.log(`Starting: ${result.name} ${result.id}`);
//     //   console.log(
//     //     "producer",
//     //     await tx
//     //       .insert(producers)
//     //       .values({
//     //         id: result.id,
//     //         type: "farm",
//     //         verified: true,
//     //         name: result.name,
//     //         summary: result.about?.substring(0, 200),
//     //         about: result.about,
//     //         subscriptionRank: 0,
//     //         createdAt: new Date(),
//     //         updatedAt: new Date(),
//     //       })
//     //       .returning()
//     //   );
//     //   if (organic) {
//     //     console.log(
//     //       "orangic cert",
//     //       await tx
//     //         .insert(producerCertifications)
//     //         .values({
//     //           producerId: result.id,
//     //           certificationId: organic.id,
//     //           addedAt: new Date(),
//     //         })
//     //         .returning()
//     //     );
//     //   }
//     //   if (realOrganic) {
//     //     console.log(
//     //       "realOrganic cert",
//     //       await tx
//     //         .insert(producerCertifications)
//     //         .values({
//     //           producerId: result.id,
//     //           certificationId: realOrganic.id,
//     //           addedAt: new Date(),
//     //         })
//     //         .returning()
//     //     );
//     //   }
//     //   if (result.socials && result.socials.length > 0) {
//     //     console.log(
//     //       "social",
//     //       await tx
//     //         .insert(producerSocial)
//     //         .values({
//     //           producerId: result.id,
//     //           instagram: result.socials.find((r) => r.includes("instagram")),
//     //           facebook: result.socials.find((r) => r.includes("facebook")),
//     //         })
//     //         .returning()
//     //     );
//     //   }
//     //   console.log(
//     //     "contact",
//     //     await tx
//     //       .insert(producerContact)
//     //       .values({
//     //         producerId: result.id,
//     //         websiteUrl: result.url,
//     //         email:
//     //           result.email && result.email.trim().length > 0
//     //             ? result.email.trim()
//     //             : undefined,
//     //         phone:
//     //           result.phone && result.phone.trim().length > 0
//     //             ? `+1${result.phone.trim()}`
//     //             : undefined,
//     //       })
//     //       .returning()
//     //   );
//     //   const searchLabels = new Set<string>();
//     //   if (result.certifiedProducts && result.certifiedProducts.length > 0) {
//     //     for (const product of result.certifiedProducts) {
//     //       let name = product;
//     //       const variants: string[] = [];
//     //       if (name.includes("/")) {
//     //         const parts = name.split("/");
//     //         name = parts[0].trim();
//     //         variants.push(...parts.slice(1, parts.length).map((s) => s.trim()));
//     //       }
//     //       const slug = name.toLowerCase().replaceAll(" ", "_");
//     //       searchLabels.add(`comm_${slug}`);
//     //       let com: {
//     //         id: number;
//     //         name: string;
//     //         createdAt: Date;
//     //         updatedAt: Date;
//     //         slug: string;
//     //       };
//     //       console.log("wanting commodity with slug", slug);
//     //       const existing = await tx.query.commodities.findFirst({
//     //         where: eq(commodities.slug, slug),
//     //       });
//     //       console.log(existing);
//     //       if (existing) {
//     //         com = existing;
//     //       } else {
//     //         console.log("created commodity");
//     //         com = await tx
//     //           .insert(commodities)
//     //           .values({
//     //             slug: slug,
//     //             name: name,
//     //             createdAt: new Date(),
//     //             updatedAt: new Date(),
//     //           })
//     //           .returning()
//     //           .then((r) => r[0]);
//     //       }
//     //       console.log("commodity", com);
//     //       if (variants.length > 0) {
//     //         for (const variant of variants) {
//     //           const variantSlug = variant.toLowerCase().replaceAll(" ", "_");
//     //           await tx
//     //             .insert(commodityVariants)
//     //             .values({
//     //               commodityId: com.id,
//     //               name: variant,
//     //               slug: variantSlug,
//     //             })
//     //             .onConflictDoNothing();
//     //         }
//     //       }
//     //       await tx.insert(producerCommodities).values({
//     //         producerId: result.id,
//     //         commodityId: com.id,
//     //         updatedAt: new Date(),
//     //         certifications: [organic.id, realOrganic.id],
//     //       });
//     //     }
//     //   }
//     //   if (result.address) {
//     //     const halves = result.address.split(",");
//     //     const first = halves[0].split(" ").filter((i) => i.trim().length > 0);
//     //     const second = halves[1].split(" ").filter((i) => i.trim().length > 0);
//     //     const city = first[first.length - 1];
//     //     const street = first.slice(0, first.length - 1).join(" ");
//     //     const state = second[0];
//     //     const zip = second[1];
//     //     const country = "usa";
//     //     let lat: number | undefined = undefined;
//     //     let lon: number | undefined = undefined;
//     //     let geohash: string | undefined = undefined;
//     //     const geocode = await geocodeAddress(result.address);
//     //     if (geocode.status === "OK") {
//     //       const item = geocode.results[0];
//     //       lat = Number(item.geometry.location.lat);
//     //       lon = Number(item.geometry.location.lng);
//     //       geohash = ngeohash.encode(lat, lon);
//     //     } else {
//     //       console.log(`geocode failed for ${result.name}`);
//     //     }
//     //     console.log(
//     //       await tx
//     //         .insert(producerLocation)
//     //         .values({
//     //           producerId: result.id,
//     //           city: city,
//     //           geohash: geohash,
//     //           locality: street,
//     //           adminArea: state,
//     //           postcode: zip,
//     //           country: country,
//     //           latitude: lat,
//     //           longitude: lon,
//     //         })
//     //         .returning()
//     //     );
//     //   }
//     //   for (const [channel, has] of Object.entries(result.buyingOptions)) {
//     //     if (has) {
//     //       searchLabels.add(`chann_${channel.replaceAll("-", "_")}`);
//     //     }
//     //   }
//     //   if (result.farmer && result.farmer.trim().length > 0) {
//     //     searchLabels.add(
//     //       `farmer_${result.farmer.trim().toLowerCase().replaceAll(" ", "_")}`
//     //     );
//     //   }
//     //   console.log(searchLabels);
//     //   console.log(
//     //     await tx
//     //       .insert(producersSearch)
//     //       .values({
//     //         producerId: result.id,
//     //         searchName: result.name,
//     //         searchSummary: result.about.substring(0, 200),
//     //         searchLabels: searchLabels.values().toArray().join(" "),
//     //       })
//     //       .returning()
//     //   );
//     // });
//   }
// }

// run();
