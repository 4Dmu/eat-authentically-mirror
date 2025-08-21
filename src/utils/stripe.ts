import {
  mutationOptions,
  UseMutationOptions,
  WithRequired,
} from "@tanstack/react-query";
import { createBillingPortalSession } from "@/backend/rpc/stripe";
import { throwErrors } from "./actions";

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
      await createBillingPortalSession(props).then((t) => throwErrors(t)),
    onSuccess: params?.onSuccess,
    onError: params?.onError,
  });
