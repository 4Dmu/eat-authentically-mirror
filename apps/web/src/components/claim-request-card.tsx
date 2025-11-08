"use client";
import { CLAIM_DNS_TXT_RECORD_NAME } from "@ea/shared/constants";
import { PublicClaimRequest } from "@ea/validators/producers";
import { useCheckClaimDomainDns, useVerifyClaimPhone } from "@/utils/producers";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useForm } from "@tanstack/react-form";
import { FieldInfo } from "./forms/helpers/field-info";
import dynamic from "next/dynamic";

export function ClaimRequestCard({
  claimRequest,
}: {
  claimRequest: PublicClaimRequest;
}) {
  const checkClaimDomainDNS = useCheckClaimDomainDns({
    onSuccess: (message) => toast.success(message),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border p-5 shadow flex flex-col gap-0 flex-1 bg-white">
      <div className="flex justify-between items-center gap-5">
        <p className="text-lg">
          Claim Submitted:{" "}
          <span className="font-bold">{claimRequest.producer.name}</span>
        </p>
        <div className="flex gap-2">
          <Badge
            variant={match(claimRequest.status.type)
              .with("claimed", () => "brandGreen" as const)
              .with("expired", () => "brandRed" as const)
              .with("waiting", () => "brandBrown" as const)
              .exhaustive()}
          >
            Status: {claimRequest.status.type}
          </Badge>
        </div>
      </div>
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
                )
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
                )
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
                )
              )
              .with(
                {
                  requestedVerification: {
                    method: "contact-phone-link",
                  },
                },
                (cr) => (
                  <>
                    <VerifyContactPhoneInstructions cr={cr} />
                  </>
                )
              )
              .exhaustive()}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

const RegenerateClaimPhoneCode = dynamic(
  () =>
    import("./claim-request-regenerate-phone-claim-code").then(
      (r) => r.RegenerateClaimPhoneCode
    ),
  { ssr: false }
);

function VerifyContactPhoneInstructions({
  cr,
}: {
  cr: P.narrow<
    PublicClaimRequest,
    {
      requestedVerification: {
        method: "contact-phone-link";
      };
    }
  >;
}) {
  const verifyClaimPhoneMutation = useVerifyClaimPhone({
    onError: (e) => toast.error(e.message),
  });

  const form = useForm({
    defaultValues: {
      code: "",
    },
    onSubmit: ({ value }) =>
      verifyClaimPhoneMutation.mutate({
        code: value.code,
        claimRequestId: cr.id,
      }),
  });

  return (
    <div className="flex flex-col gap-3">
      <p>
        Enter the code sent to the following number:{" "}
        {cr.requestedVerification.producerContactPhone}
      </p>
      {cr.status.type === "waiting" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex gap-5 p-2"
        >
          <form.Field
            validators={{
              onChange: ({ value }) => {
                const matcher = new RegExp(REGEXP_ONLY_DIGITS);
                if (value.length !== 6) {
                  return "Code must be six digits";
                }

                if (!matcher.test(value)) {
                  return "Code only be digits";
                }
              },
            }}
            name="code"
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <InputOTP
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  onChange={field.handleChange}
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <div className="flex gap-3">
            <form.Subscribe
              selector={(state) => state.isValid && state.isDirty}
            >
              {(state) => (
                <Button disabled={!state || verifyClaimPhoneMutation.isPending}>
                  Submit
                </Button>
              )}
            </form.Subscribe>
            <RegenerateClaimPhoneCode claimRequest={cr} />
          </div>
        </form>
      )}
    </div>
  );
}
