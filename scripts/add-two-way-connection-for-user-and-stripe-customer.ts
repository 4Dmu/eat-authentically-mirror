// import {
//   STRIPE_CUSTOMER_ID_USER_KV,
//   USER_STRIPE_CUSTOMER_ID_KV,
// } from "@/backend/kv";
// import { clerk } from "@/backend/lib/clerk";

// export async function main() {
//   const users = await clerk.users.getUserList();

//   for (const user of users.data) {
//     const customer = await USER_STRIPE_CUSTOMER_ID_KV.get(user.id);
//     if (!customer) {
//       console.log("skipping user", user.id);
//       continue;
//     }

//     await STRIPE_CUSTOMER_ID_USER_KV.set(customer, user.id);
//   }
// }

// main();
