import {
  mutationOptions,
  UseMutationOptions,
  WithRequired,
} from "@tanstack/react-query";
import { createBillingPortalSession } from "@/backend/rpc/stripe";

type GeocodeRegionMutationOpsType = WithRequired<
  UseMutationOptions<string, Error, { redirectPath: string }, unknown>,
  "mutationKey"
>;

export const billingPortableMutationOpts = (params?: {
  onError?: GeocodeRegionMutationOpsType["onError"];
  onSuccess?: GeocodeRegionMutationOpsType["onSuccess"];
}) =>
  mutationOptions({
    mutationKey: ["create-billing-portal-session"],
    mutationFn: async (props: { redirectPath: string }) =>
      await createBillingPortalSession(props),
    onSuccess: params?.onSuccess,
    onError: params?.onError,
  });
