// "use server";
// import { organizationActionClient } from "./helpers/middleware";
// import { env } from "@/env";
// import { db } from "../db";
// import { getOrgSubTier } from "./utils/get-sub-tier";
// import * as schema from "../db/schema";
// import { eq } from "drizzle-orm";

// type CreateUploadUrlResponse =
//   | {
//       result: undefined;
//       result_info: null;
//       success: false;
//       errors: unknown[];
//       messages: unknown[];
//     }
//   | {
//       result: {
//         id: string;
//         uploadURL: string;
//       };
//       result_info: null;
//       success: true;
//       errors: [];
//       messages: [];
//     };

// export const requestImageUploadUrl = organizationActionClient.action(
//   async ({ ctx: {} }) => {
//     const plan = await getOrgSubTier({ providedOrgId: orgId });
//     const uploadHistory = await db.query.uploadHistory.findFirst({
//       where: eq(schema.uploadHistory.organizationId, orgId),
//     });
//     if (!uploadHistory) {
//       const formData = new FormData();
//       formData.set("metadata", JSON.stringify({ orgId: orgId }));
//       const createUploadUrlResponse = await fetch(
//         `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
//         {
//           method: "POST",
//           body: formData,
//           headers: {
//             Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
//           },
//         }
//       );
//       const createUploadUrlResult =
//         (await createUploadUrlResponse.json()) as CreateUploadUrlResponse;
//       if (!createUploadUrlResult.success) {
//         console.log(createUploadUrlResult.errors);
//         throw new Error("Error creating upload for");
//       }
//       await putOrgIdForImageUploadId({
//         imageId: createUploadUrlResult.result.id,
//         orgId: orgId,
//       });
//       await db.insert(schema.uploadHistory).values({
//         organizationId: orgId,
//         imageUploadAttempts: [
//           {
//             cloudflareImageId: createUploadUrlResult.result.id,
//             createdAt: new Date(),
//           },
//         ],
//         imageUploads: [],
//       });
//       return createUploadUrlResult.result.uploadURL;
//     }
//     if (plan === "Premium" && uploadHistory.imageUploads.length >= 10) {
//       throw new Error("Exceeded allowed images for plan");
//     } else if (plan === "Pro" && uploadHistory.imageUploads.length >= 5) {
//       throw new Error("Exceeded allowed images for plan");
//     } else if (plan === "Free" && uploadHistory.imageUploads.length >= 1) {
//       throw new Error("Exceeded allowed images for plan");
//     }
//     const formData = new FormData();
//     formData.set("metadata", JSON.stringify({ orgId: orgId }));
//     const createUploadUrlResponse = await fetch(
//       `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
//       {
//         method: "POST",
//         body: formData,
//         headers: {
//           Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
//         },
//       }
//     );
//     const createUploadUrlResult =
//       (await createUploadUrlResponse.json()) as CreateUploadUrlResponse;
//     if (!createUploadUrlResult.success) {
//       console.log(createUploadUrlResult.errors);
//       throw new Error("Error creating upload for");
//     }
//     await putOrgIdForImageUploadId({
//       imageId: createUploadUrlResult.result.id,
//       orgId: orgId,
//     });
//     await db
//       .update(schema.uploadHistory)
//       .set({
//         imageUploadAttempts: [
//           ...uploadHistory.imageUploadAttempts,
//           {
//             cloudflareImageId: createUploadUrlResult.result.id,
//             createdAt: new Date(),
//           },
//         ],
//       })
//       .where(eq(schema.uploadHistory.organizationId, orgId));
//     return createUploadUrlResult.result.uploadURL;
//   }
// );
