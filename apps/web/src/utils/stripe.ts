import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { createBillingPortalSession } from "@/backend/rpc/stripe";

export function useBillingPortableMutation(
  opts?: Omit<
    UseMutationOptions<string, Error, { redirectPath: string }, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["create-billing-portal-session"],
    mutationFn: async (props: { redirectPath: string }) =>
      await createBillingPortalSession(props),
  });
}
