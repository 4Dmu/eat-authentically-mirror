"use client";
import { CLAIM_DNS_TXT_RECORD_NAME } from "@/backend/rpc/helpers/constants";
import { PublicClaimRequest } from "@/backend/validators/producers";
import { checkClaimDomainDnsOpts } from "@/utils/producers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

export function ClaimRequestCard({
  claimRequest,
}: {
  claimRequest: PublicClaimRequest;
}) {
  const queryClient = useQueryClient();
  const checkClaimDomainDNS = useMutation(
    checkClaimDomainDnsOpts({
      deps: { queryClient },
      opts: {
        onSuccess: (message) => toast.success(message),
        onError: (e) => toast.error(e.message),
      },
    }),
  );

  return (
    <div className="rounded-lg border p-5 shadow flex flex-col gap-5 flex-1 bg-white">
      <div className="flex justify-between items-center gap-5">
        <p className="text-lg">
          Claim Submitted:{" "}
          <span className="font-bold">{claimRequest.producer.name}</span>
        </p>
        <Badge>Status: {claimRequest.status.type}</Badge>
      </div>

      {claimRequest.requestedVerification.method === "domain-dns" &&
        claimRequest.status.type === "waiting" && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <p>Add the following domain dns record: </p>
              <div className="flex flex-col gap-2">
                <p>Domain: {claimRequest.requestedVerification.domain}</p>
                <p>Type: TXT</p>
                <p>Name: {CLAIM_DNS_TXT_RECORD_NAME}</p>
                <p>
                  Value:{" "}
                  <span className="break-all">
                    {claimRequest.requestedVerification.token}
                  </span>
                </p>
              </div>
              <Button
                className="cursor-pointer"
                variant={"outline"}
                onClick={() =>
                  checkClaimDomainDNS.mutate({
                    claimRequestId: claimRequest.id,
                  })
                }
              >
                Check Dns
              </Button>
            </div>
          </>
        )}
    </div>
  );
}
