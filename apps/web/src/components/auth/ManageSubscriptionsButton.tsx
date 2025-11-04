import { Button } from "../ui/button";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { useBillingPortableMutation } from "@/utils/stripe";

export function ManageSubscriptionsButton() {
  const createBillingPortalSessionMutation = useBillingPortableMutation({
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err) => toast.error(err.message),
  });

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
