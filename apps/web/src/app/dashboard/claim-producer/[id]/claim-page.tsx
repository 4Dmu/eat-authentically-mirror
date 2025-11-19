"use client";
import type { ProducerWith } from "@ea/db/schema";
import type { ProducerClaimVerificationMethods } from "@ea/validators/producers";
import { Button } from "@ea/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@ea/ui/card";
import { Checkbox } from "@ea/ui/checkbox";
import { Input } from "@ea/ui/input";
import { Label } from "@ea/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ea/ui/select";
import { Separator } from "@ea/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ea/ui/tabs";
import { useClaimProducerSteps } from "@/hooks/use-claim-producer-steps";
import { countryByAlpha3Code } from "@/utils/contries";
import { useClaimProducer } from "@/utils/producers";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { match } from "ts-pattern";

export function ClaimPage({
  producer,
}: {
  producer: ProducerWith<"contact" | "social" | "location">;
}) {
  const [verification, setVerification] = useState<
    ProducerClaimVerificationMethods | undefined
  >(undefined);
  const router = useRouter();
  const { step, setStep, submitState } = useClaimProducerSteps({
    mode: "review",
    producer: producer,
  });

  const claimProducerMutation = useClaimProducer({
    onSuccess() {
      router.push("/dashboard#claim");
      toast.success("Producer claim proccess started");
    },
    onError(e) {
      toast.error(e.message);
    },
  });

  function submit() {
    if (step.mode !== "submit" || submitState.submissionRequiresData) {
      return;
    }

    claimProducerMutation.mutate({
      producerId: step.producer.id,
      verification: match(step.verification.method)
        .with("domain-email-link", (v) => ({
          method: v,
          domainDomainEmailPart: submitState.domainEmailPart ?? "",
        }))
        .with("manual", (v) => ({
          method: v,
          claimerEmail: submitState.manualContactEmail ?? "",
        }))
        .with("social-post", (v) => ({
          method: v,
          socialHandle: submitState.choosenSocialHandle ?? "",
        }))
        .otherwise((v) => ({
          method: v,
        })),
    });
  }

  return (
    <main className="p-5 md:p-10 lg:p-20 pb-20">
      <Card className="flex flex-col mx-auto max-w-7xl w-full">
        <Tabs value={step.mode}>
          <CardHeader className="flex flex-col items-center gap-10">
            <h1 className="font-bold text-3xl text-center">
              Claim {producer.name}
            </h1>
            <TabsList className="p-2 rounded-full h-[unset] border">
              <TabsTrigger
                className="rounded-full p-2 px-5 text-base"
                value="review"
              >
                Review
              </TabsTrigger>
              <TabsTrigger
                className="rounded-full p-2 px-5 text-base"
                value="verify"
              >
                Verify
              </TabsTrigger>
              <TabsTrigger
                className="rounded-full p-2 px-5 text-base"
                value="submit"
              >
                Submit
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="flex flex-col gap-10 p-10">
            <Separator />
            <TabsContent
              value="review"
              className="flex flex-col items-center gap-5"
            >
              <p className="text-center text-xl leading-8">
                Please take a minute to review the farms public information,
                <br className="max-md:hidden" /> if it seems correct then go
                ahead and continue.
              </p>
              <div className="flex flex-col gap-5 w-full max-w-3xl">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <p className="md:text-lg h-[unset] p-3">{producer.name}</p>
                </div>
                {producer.contact?.phone && (
                  <div className="flex flex-col gap-2">
                    <Label>Phone</Label>
                    <p className="md:text-lg h-[unset] p-3">
                      {producer.contact?.phone ?? undefined}
                    </p>
                  </div>
                )}
                {producer.contact?.email && (
                  <div className="flex flex-col gap-2">
                    <Label>Email</Label>
                    <p className="md:text-lg h-[unset] p-3">
                      {producer.contact?.email}
                    </p>
                  </div>
                )}
                {producer.contact?.websiteUrl && (
                  <div className="flex flex-col gap-2">
                    <Label>Website</Label>
                    <p className="md:text-lg h-[unset] p-3">
                      {producer.contact?.websiteUrl}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label>Address</Label>
                  <p className="md:text-lg h-[unset] p-3">
                    {`${producer.location?.locality ?? ""}${
                      producer.location?.city
                        ? `, ${format(producer.location?.city)}`
                        : ""
                    }${format(producer.location?.adminArea) ?? ""}${
                      format(producer.location?.postcode) ?? ""
                    }${
                      producer.location?.country
                        ? countryByAlpha3Code(producer.location.country)?.name
                        : ""
                    }`}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="verify">
              {step.mode === "verify" && (
                <div className="flex flex-col items-center gap-5 pb-5">
                  <p className="text-center">
                    Select a verification method to claim{" "}
                    <span className="font-bold">{step.producer.name}</span>
                  </p>
                  <p className="font-bold text-lg">Instant / Auto</p>
                  <div className="flex flex-col gap-5 w-full">
                    {step.producer.contact?.email && (
                      <VerificationCard
                        title="Email link to an address already on the listing"
                        checked={verification === "contact-email-link"}
                        onCheckedChange={(e) =>
                          e
                            ? setVerification("contact-email-link")
                            : setVerification(undefined)
                        }
                      />
                    )}
                    {step.producer.contact?.websiteUrl && (
                      <>
                        <VerificationCard
                          title="Email link to any email address on producers domain"
                          checked={verification === "domain-email-link"}
                          onCheckedChange={(e) =>
                            e
                              ? setVerification("domain-email-link")
                              : setVerification(undefined)
                          }
                        />
                        <VerificationCard
                          title="Add TXT record to domains dns"
                          checked={verification === "domain-dns"}
                          onCheckedChange={(e) =>
                            e
                              ? setVerification("domain-dns")
                              : setVerification(undefined)
                          }
                        />
                      </>
                    )}
                    {step.producer.contact?.phone && (
                      <VerificationCard
                        title="Send link to listed phone number"
                        checked={verification === "contact-phone-link"}
                        onCheckedChange={(e) =>
                          e
                            ? setVerification("contact-phone-link")
                            : setVerification(undefined)
                        }
                      />
                    )}
                  </div>
                  <p className="font-bold text-lg">Slow / Human</p>
                  <div className="flex flex-col gap-5 w-full">
                    {(step.producer.social?.facebook ||
                      step.producer.social?.instagram ||
                      step.producer.social?.twitter) && (
                      <VerificationCard
                        title="Post code on social media"
                        checked={verification === "social-post"}
                        onCheckedChange={(e) =>
                          e
                            ? setVerification("social-post")
                            : setVerification(undefined)
                        }
                      />
                    )}
                    <VerificationCard
                      title="Manual verification"
                      text={
                        <p>
                          Have some other way to verify your the owner of{" "}
                          <span className="font-bold">
                            {step.producer.name}
                          </span>
                          ? If so or your can&apos;t use any of the above
                          methods then you can reach out to our team who will
                          try to manually verify over email.
                        </p>
                      }
                      checked={verification === "manual"}
                      onCheckedChange={(e) =>
                        e
                          ? setVerification("manual")
                          : setVerification(undefined)
                      }
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="submit">
              {step.mode === "submit" && (
                <div className="flex flex-col gap-5 p-5 items-center text-center">
                  <p>
                    Claim{" "}
                    <span className="font-bold">{step.producer.name}</span> by{" "}
                    {match(step.verification)
                      .with({ method: "contact-email-link" }, (v) => (
                        <span>
                          clicking link in email sent to{" "}
                          <span className="font-bold">{v.email}</span>
                        </span>
                      ))
                      .with({ method: "contact-phone-link" }, (v) => (
                        <span>
                          entering the code send to following number{" "}
                          <span className="font-bold">{v.phone}</span> in the
                          claim section of your dashboard.
                        </span>
                      ))
                      .with({ method: "domain-dns" }, (v) => (
                        <span>
                          adding a TXT DNS record containing our code to domain:{" "}
                          <span className="font-bold">{v.domain}</span>
                        </span>
                      ))
                      .with({ method: "domain-email-link" }, (v) => (
                        <span>
                          clicking link in email sent to your choice of email
                          using the domain{" "}
                          <span className="font-bold">{v.domain}</span>
                        </span>
                      ))
                      .with({ method: "social-post" }, () => (
                        <span>
                          making social post using our code to one of the
                          following handles:
                        </span>
                      ))
                      .with({ method: "manual" }, () => (
                        <span>
                          replying to the email we will send about your claim
                          request to the following address:
                        </span>
                      ))
                      .exhaustive()}
                  </p>
                  {step.verification.method === "domain-email-link" && (
                    <>
                      <Input
                        value={submitState.domainEmailPart ?? ""}
                        onChange={(e) =>
                          submitState.setDomainEmailPart(
                            e.currentTarget.value.length === 0
                              ? undefined
                              : e.currentTarget.value
                          )
                        }
                      />
                      <p>
                        The email will be sent to{" "}
                        <span className="font-bold">
                          {submitState.domainEmailPart}@
                          {step.verification.domain}
                        </span>
                      </p>
                    </>
                  )}
                  {step.verification.method === "manual" && (
                    <>
                      <Input
                        value={submitState.manualContactEmail ?? ""}
                        onChange={(e) =>
                          submitState.setManualContactEmail(
                            e.currentTarget.value.length === 0
                              ? undefined
                              : e.currentTarget.value
                          )
                        }
                      />
                      <p>
                        The email will be sent to{" "}
                        <span className="font-bold">
                          {submitState.manualContactEmail}
                        </span>
                      </p>
                    </>
                  )}
                  {step.verification.method === "social-post" && (
                    <Select
                      value={submitState.choosenSocialHandle ?? ""}
                      onValueChange={(e) =>
                        submitState.setChoosenSocialHandle(e)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {step.verification.socialProfiles.map((s) => (
                          <SelectItem value={s} key={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </TabsContent>
          </CardContent>
          <CardFooter className="w-full justify-center gap-5">
            <Button
              className="w-32"
              disabled={step.mode === "review"}
              onClick={() =>
                match(step)
                  .with({ mode: "verify" }, (s) =>
                    setStep({ mode: "review", producer: s.producer })
                  )
                  .with({ mode: "submit" }, (s) =>
                    setStep({ mode: "verify", producer: s.producer })
                  )
                  .otherwise(() => {})
              }
            >
              Previous
            </Button>
            {(step.mode === "review" || step.mode === "verify") && (
              <Button
                className="w-32"
                disabled={step.mode === "verify" && verification === undefined}
                variant={"brandGreen"}
                onClick={() => {
                  if (step.mode === "review") {
                    setStep({ mode: "verify", producer: step.producer });
                  } else if (
                    step.mode === "verify" &&
                    verification !== undefined
                  ) {
                    setStep({
                      mode: "submit",
                      producer: step.producer,
                      verification: verification,
                    });
                  }
                }}
              >
                Continue
              </Button>
            )}
            {step.mode === "submit" && (
              <Button
                className="w-32"
                variant={"brandGreen"}
                onClick={submit}
                disabled={
                  step.mode !== "submit" ||
                  submitState.submissionRequiresData ||
                  claimProducerMutation.isPending
                }
              >
                Submit
              </Button>
            )}
          </CardFooter>
        </Tabs>
      </Card>
    </main>
  );
}

function VerificationCard({
  title,
  text,
  checked,
  onCheckedChange,
}: {
  title: string;
  text?: ReactNode;
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}) {
  return (
    <Card className="p-5 flex flex-row items-center justify-between">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="size-8"
      />
      <div className="flex flex-col w-full gap-2">
        <p className="font-bold">{title}</p>
        {text}
      </div>
    </Card>
  );
}

function format(value: string | undefined | null) {
  if (!value) return "";
  return `${value}, `;
}
