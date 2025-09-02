"use client";
import { CLAIM_DNS_TXT_RECORD_NAME } from "@/backend/rpc/helpers/constants";
import { PublicClaimRequest } from "@/backend/validators/producers";
import { checkClaimDomainDnsOpts } from "@/utils/producers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { match, P } from "ts-pattern";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    <div className="rounded-lg border p-5 shadow flex flex-col gap-0 flex-1 bg-white">
      <div className="flex justify-between items-center gap-5">
        <p className="text-lg">
          Claim Submitted:{" "}
          <span className="font-bold">{claimRequest.producer.name}</span>
        </p>
        <Badge
          variant={match(claimRequest.status.type)
            .with("claimed", () => "brandGreen" as const)
            .with("expired", () => "brandRed" as const)
            .with("waiting", () => "default" as const)
            .exhaustive()}
        >
          Status: {claimRequest.status.type}
        </Badge>
      </div>
      {/*{claimRequest.requestedVerification.method === "domain-dns" &&
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
      {claimRequest.requestedVerification.method === "manual" &&
        claimRequest.status.type === "waiting" && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <p>
                Please reply to the email we sent to the following address:{" "}
                {claimRequest.requestedVerification.claimerEmail}
              </p>
            </div>
          </>
        )}
      {claimRequest.requestedVerification.method === "social-post" &&
        claimRequest.status.type === "waiting" && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <p>
                Please make a social post on the following social media profile
                that mentions EatAuthentically.
              </p>
              <div className="flex flex-col gap-2">
                <p>
                  Profile:{" "}
                  <a
                    className="underline"
                    target="_blank"
                    href={claimRequest.requestedVerification.socialHandle}
                  >
                    {claimRequest.requestedVerification.socialHandle}
                  </a>
                </p>
              </div>
            </div>
          </>
        )}
      {(claimRequest.requestedVerification.method === "contact-email-link" ||
        claimRequest.requestedVerification.method === "domain-email-link") && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p>
              Click the link contained in the email we sent to the following
              address:{" "}
              {claimRequest.requestedVerification.method ===
              "contact-email-link"
                ? claimRequest.requestedVerification.producerContactEmail
                : claimRequest.requestedVerification.domainDomainEmailPart}
            </p>
          </div>
        </>
      )}*/}
      <Accordion
        type="single"
        collapsible
        defaultValue={
          claimRequest.status.type === "waiting" ? "item-1" : undefined
        }
      >
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-base">
            Instructions
          </AccordionTrigger>
          <AccordionContent>
            {match(claimRequest)
              .with(
                { requestedVerification: { method: "domain-dns" } },
                (cr) => (
                  <>
                    <div className="flex flex-col gap-3">
                      <p>Add the following domain dns record: </p>
                      <div className="flex flex-col gap-2">
                        <p>Domain: {cr.requestedVerification.domain}</p>
                        <p>Type: TXT</p>
                        <p>Name: {CLAIM_DNS_TXT_RECORD_NAME}</p>
                        <p>
                          Value:{" "}
                          <span className="break-all">
                            {cr.requestedVerification.token}
                          </span>
                        </p>
                      </div>
                      <Button
                        className="cursor-pointer"
                        variant={"outline"}
                        onClick={() =>
                          checkClaimDomainDNS.mutate({
                            claimRequestId: cr.id,
                          })
                        }
                      >
                        Check Dns
                      </Button>
                    </div>
                  </>
                ),
              )
              .with({ requestedVerification: { method: "manual" } }, (cr) => (
                <>
                  <div className="flex flex-col gap-3">
                    <p>
                      Please reply to the email we sent to the following
                      address: {cr.requestedVerification.claimerEmail}
                    </p>
                  </div>
                </>
              ))
              .with(
                { requestedVerification: { method: "social-post" } },
                (cr) => (
                  <>
                    <div className="flex flex-col gap-3">
                      <p>
                        Please make a social post on the following social media
                        profile that mentions EatAuthentically.
                      </p>
                      <div className="flex flex-col gap-2">
                        <p>
                          Profile:{" "}
                          <a
                            className="underline"
                            target="_blank"
                            href={cr.requestedVerification.socialHandle}
                          >
                            {cr.requestedVerification.socialHandle}
                          </a>
                        </p>
                      </div>
                    </div>
                  </>
                ),
              )
              .with(
                {
                  requestedVerification: {
                    method: P.union("contact-email-link", "domain-email-link"),
                  },
                },
                (cr) => (
                  <>
                    <div className="flex flex-col gap-3">
                      <p>
                        Click the link contained in the email we sent to the
                        following address:{" "}
                        {cr.requestedVerification.method ===
                        "contact-email-link"
                          ? cr.requestedVerification.producerContactEmail
                          : cr.requestedVerification.domainDomainEmailPart}
                      </p>
                    </div>
                  </>
                ),
              )
              .with(
                {
                  requestedVerification: {
                    method: "contact-phone-link",
                  },
                },
                (cr) => (
                  <>
                    <div className="flex flex-col gap-3">
                      <p>
                        Click the link contained in the sms message we sent to
                        the following number:{" "}
                        {cr.requestedVerification.producerContactPhone}
                      </p>
                    </div>
                  </>
                ),
              )
              .exhaustive()}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
