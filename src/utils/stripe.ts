// import {
//   mutationOptions,
//   UseMutationOptions,
//   WithRequired,
// } from "@tanstack/react-query";
// import { createBillingPortalSession } from "~/backend/rpc/stripe";

// type GeocodeRegionMutationOpsType = WithRequired<
//   UseMutationOptions<string, Error, void, unknown>,
//   "mutationKey"
// >;

// export const billingPortableMutationOpts = (params?: {
//   onError?: GeocodeRegionMutationOpsType["onError"];
//   onSuccess?: GeocodeRegionMutationOpsType["onSuccess"];
// }) =>
//   mutationOptions({
//     mutationKey: ["create-billing-portal-session"],
//     mutationFn: async () => await createBillingPortalSession(),
//     onSuccess: params?.onSuccess,
//     onError: params?.onError,
//   });
