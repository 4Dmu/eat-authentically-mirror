import { Button } from "../ui/button";
import { Landmark } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingPortableMutationOpts } from "@/utils/stripe";

export function ManageSubscriptionsButton() {
  const createBillingPortalSessionMutation = useMutation(
    billingPortableMutationOpts({
      onSuccess: (url) => {
        window.location.href = url;
      },
      onError: (err) => toast.error(err.message),
    })
  );

  return (
    <Button
      onClick={() =>
        createBillingPortalSessionMutation.mutate({
          redirectPath: window.location.pathname,
        })
      }
      variant={"ghost"}
      className="w-full justify-start gap-5"
    >
      <Landmark />
      <span>Change subscriptions</span>
    </Button>
  );
}
