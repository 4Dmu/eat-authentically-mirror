// import { eq } from "drizzle-orm";
// import { db } from "../db";
// import {
//   certificationsToListings,
//   listings,
// } from "../db/schema";
// import { ORG_DATA_KV, USER_ORG_ID_KV } from "../kv";
// import { cloudflare } from "../lib/cloudflare";
// import { env } from "@/env";

// export async function getUsersOrganizationIdCached(userId: string) {
//   const organizationId = await USER_ORG_ID_KV.get(userId);

//   if (organizationId) {
//     return organizationId;
//   }

//   const orgIdFromDb = await db.query.organizations
//     .findFirst({
//       columns: { id: true },
//       where: eq(organizations.ownerUserId, userId),
//     })
//     .then((org) => org?.id);

//   if (orgIdFromDb) {
//     await USER_ORG_ID_KV.set(userId, orgIdFromDb);
//     return orgIdFromDb;
//   }

//   return null;
// }

// export async function getUsersOrganizationId(userId: string) {
//   const orgIdFromDb = await db.query.organizations
//     .findFirst({
//       columns: { id: true },
//       where: eq(organizations.ownerUserId, userId),
//     })
//     .then((org) => org?.id);

//   return orgIdFromDb;
// }

// export async function deleteOrganization(organizationId: string) {
//   const listing = await db.query.listings.findFirst({
//     where: eq(listings.organizationId, organizationId),
//   });

//   if (listing?.images) {
//     for (const image of listing?.images.items) {
//       console.log(
//         `data [deleteOrganization] - Deleting image (${image.cloudflareId})`
//       );

//       const response = await cloudflare.images.v1.delete(image.cloudflareId, {
//         account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
//       });

//       console.log(
//         `action [deleteOrganization] - Cloudflare delete image response`,
//         response
//       );
//     }
//   }

//   if (listing?.video) {
//     await cloudflare.stream.delete(listing.video.uid, {
//       account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
//     });
//   }

//   await db.transaction(async (tx) => {
//     if (listing) {
//       await tx
//         .delete(certificationsToListings)
//         .where(eq(certificationsToListings.listingId, listing.id));
//     }

//     await tx
//       .delete(listings)
//       .where(eq(listings.organizationId, organizationId));
//     await tx.delete(organizations).where(eq(organizations.id, organizationId));
//     await ORG_DATA_KV.delete(organizationId);
//   });
// }
