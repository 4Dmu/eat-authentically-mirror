import { PublicClaimRequest } from "@ea/validators/producers";
import { useRegenerateClaimPhoneToken } from "@/utils/producers";
import { addMinutes, differenceInSeconds, isAfter } from "date-fns";
import { RotateCwIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { P } from "ts-pattern";
import { Button } from "./ui/button";

function calculateTimeLeft(tokenExpiresAt: Date) {
  const now = new Date();
  if (isAfter(now, tokenExpiresAt)) {
    return 0;
  }
  return differenceInSeconds(tokenExpiresAt, now);
}

export function RegenerateClaimPhoneCode({
  claimRequest: cr,
}: {
  claimRequest: P.narrow<
    PublicClaimRequest,
    {
      requestedVerification: {
        method: "contact-phone-link";
      };
    }
  >;
}) {
  const [expiresAt, setExpiresAt] = useState(
    () => cr.requestedVerification.tokenExpiresAt
  );
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(cr.requestedVerification.tokenExpiresAt)
  );

  const isExpired = timeLeft <= 0;

  const regenerate = useRegenerateClaimPhoneToken({
    onSuccess() {
      const at = addMinutes(new Date(), 3);
      setExpiresAt(at);
      setTimeLeft(calculateTimeLeft(at));
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    // Recalculate every second
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(expiresAt);

      setTimeLeft(newTimeLeft);

      if (newTimeLeft === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <Button
      type="button"
      onClick={() => regenerate.mutate({ claimRequestId: cr.id })}
      disabled={!isExpired || regenerate.isPending}
    >
      <RotateCwIcon />
      {isExpired ? "Resend" : `Resend in ${timeLeft}s`}
    </Button>
  );
}
