"use client";
import React, {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ea/ui/dialog";
import { Button } from "@ea/ui/button";
import { useClaimProducer, useProducers } from "@/utils/producers";
import { useDebounce } from "@uidotdev/usehooks";
import { Input } from "@ea/ui/input";
import { ScrollArea } from "@ea/ui/scroll-area";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ea/ui/tabs";
import { ProducerClaimVerificationMethods } from "@ea/validators/producers";
import Image from "next/image";
import { match } from "ts-pattern";
import { Label } from "@ea/ui/label";
import { countryByAlpha3Code } from "@/utils/contries";
import { Card } from "@ea/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ea/ui/select";
import { toast } from "sonner";
import {
  Step,
  StepSetter,
  useClaimProducerSteps,
} from "@/hooks/use-claim-producer-steps";
import { primaryImageUrl } from "@/utils/producer-helpers";

const LIMIT = 50;

function usePaginatedProducers() {
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState<string | undefined>(undefined);

  const debouncedQuery = useDebounce(query, 500);

  const page = offset / LIMIT;

  const { data, isPlaceholderData } = useProducers({
    limit: LIMIT,
    offset: offset,
    query: query,
  });

  const setPage = useCallback(
    (pageOrFn: number | ((old: number) => number)) => {
      const newPage =
        typeof pageOrFn === "function" ? pageOrFn(page) : pageOrFn;

      const newOffset = newPage * LIMIT;
      setOffset(newOffset);
    },
    [setOffset, page]
  );

  useEffect(() => {
    setOffset(0);
  }, [debouncedQuery]);

  return { page, setPage, query, setQuery, data, isPlaceholderData };
}

export function ClaimProducerDialog(props: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const { step, setStep, submitState } = useClaimProducerSteps();
  const { query, setQuery, page, setPage, data, isPlaceholderData } =
    usePaginatedProducers();

  const closeDialog = () => {
    setStep({ mode: "select" });
    setPage(0);
    setQuery(undefined);
    setOpen(false);
  };

  const claimProducerMutation = useClaimProducer({
    onSuccess() {
      closeDialog();
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
          domainDomainEmailPart: submitState.domainEmailPart!,
        }))
        .with("manual", (v) => ({
          method: v,
          claimerEmail: submitState.manualContactEmail!,
        }))
        .with("social-post", (v) => ({
          method: v,
          socialHandle: submitState.choosenSocialHandle!,
        }))
        .otherwise((v) => ({
          method: v,
        })),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        if (!e) {
          setStep({ mode: "select" });
          setPage(0);
          setQuery(undefined);
        }
        setOpen(e);
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-3xl h-[95%] flex flex-col"
      >
        <Tabs value={step.mode} className="h-full flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Claim Producer</DialogTitle>
              <TabsList>
                <TabsTrigger value="select">Select</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="verify">Verify</TabsTrigger>
                <TabsTrigger value="submit">Submit</TabsTrigger>
              </TabsList>
            </div>
          </DialogHeader>

          <TabsContent value="select" className="p-5 flex-1 min-h-0">
            <div className="flex flex-col gap-5 h-full min-h-0">
              <Input
                placeholder="Search producers"
                value={query ?? ""}
                onChange={(e) =>
                  setQuery(
                    e.currentTarget.value.length == 0
                      ? undefined
                      : e.currentTarget.value
                  )
                }
              />
              <div className="h-full w-full flex-1 overflow-auto">
                <div className="flex flex-col gap-3">
                  {data?.items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setStep({ mode: "review", producer: p })}
                      className="bg-white hover:bg-accent cursor-pointer border overflow-hidden flex gap-2 items-center rounded-lg"
                    >
                      <Image
                        src={primaryImageUrl(p)}
                        alt=""
                        className="border-r aspect-4/3 object-cover"
                        width={100}
                        height={100}
                      />
                      <p>{p.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between gap-5">
                <span>Current Page: {page + 1}</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((old) => Math.max(old - 1, 0))}
                    disabled={page === 0}
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    onClick={() => {
                      if (!isPlaceholderData && data?.hasMore) {
                        setPage((old) => old + 1);
                      }
                    }}
                    // Disable the Next Page button until we know a next page is available
                    disabled={isPlaceholderData || !data?.hasMore}
                  >
                    <ArrowRight />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review" className="p-5">
            {step.mode === "review" && (
              <div className="flex flex-col gap-5">
                <p>
                  Are you the owner of{" "}
                  <span className="font-bold">{step.producer.name}</span>? If so
                  please take a moment to verify the below details are correct.
                </p>
                <div className="flex flex-col gap-3">
                  <div>
                    <Label>Phone</Label>
                    <p>{step.producer.contact?.phone}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{step.producer.contact?.email}</p>
                  </div>
                  <div>
                    <Label>Website</Label>
                    <p>{step.producer.contact?.websiteUrl}</p>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <p>
                      {step.producer.location?.locality},{" "}
                      {step.producer.location?.city},{" "}
                      {step.producer.location?.adminArea},
                      {step.producer.location?.postcode},{" "}
                      {step.producer.location?.country
                        ? countryByAlpha3Code(step.producer.location?.country)
                            ?.name
                        : undefined}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="verify" className="p-5">
            <ScrollArea className="w-full h-[40vh] pr-5">
              {step.mode === "verify" && (
                <div className="flex flex-col gap-5 pb-5">
                  <p>
                    Select a verification method to claim{" "}
                    <span className="font-bold">{step.producer.name}</span>
                  </p>
                  <p className="font-bold text-lg">Instant / Auto</p>
                  <div className="flex flex-col gap-5">
                    {step.producer.contact?.email && (
                      <VerificationCard
                        title="Email link to an address already on the listing"
                        step={step}
                        setStep={setStep}
                        verification="contact-email-link"
                      />
                    )}
                    {step.producer.contact?.websiteUrl && (
                      <>
                        <VerificationCard
                          title="Email link to any email address on producers domain"
                          step={step}
                          setStep={setStep}
                          verification="domain-email-link"
                        />
                        <VerificationCard
                          title="Add TXT record to domains dns"
                          step={step}
                          setStep={setStep}
                          verification="domain-dns"
                        />
                      </>
                    )}
                    {step.producer.contact?.phone && (
                      <VerificationCard
                        title="Send link to listed phone number"
                        step={step}
                        setStep={setStep}
                        verification="contact-phone-link"
                      />
                    )}
                  </div>
                  <p className="font-bold text-lg">Slow / Human</p>
                  <div className="flex flex-col gap-5">
                    {(step.producer.social?.facebook ||
                      step.producer.social?.instagram ||
                      step.producer.social?.twitter) && (
                      <VerificationCard
                        title="Post code on social media"
                        step={step}
                        setStep={setStep}
                        verification="social-post"
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
                      step={step}
                      setStep={setStep}
                      verification="manual"
                    />
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="submit">
            {step.mode === "submit" && (
              <div className="flex flex-col gap-5 p-5">
                <p>
                  Claim <span className="font-bold">{step.producer.name}</span>{" "}
                  by{" "}
                  {match(step.verification)
                    .with({ method: "contact-email-link" }, (v) => (
                      <span>
                        clicking link in email sent to{" "}
                        <span className="font-bold">{v.email}</span>
                      </span>
                    ))
                    .with({ method: "contact-phone-link" }, (v) => (
                      <span>
                        following link in text sent to{" "}
                        <span className="font-bold">{v.phone}</span>
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
                        Replying to the email we will send about your claim
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
                          e.currentTarget.value.length == 0
                            ? undefined
                            : e.currentTarget.value
                        )
                      }
                    />
                    <p>
                      The email will be sent to{" "}
                      <span className="font-bold">
                        {submitState.domainEmailPart}@{step.verification.domain}
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
                          e.currentTarget.value.length == 0
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
                    onValueChange={(e) => submitState.setChoosenSocialHandle(e)}
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

          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant={"destructive"}>Cancel</Button>
            </DialogClose>
            <Button
              className="ml-auto"
              variant={"outline"}
              disabled={step.mode === "select"}
              onClick={() =>
                match(step)
                  .with({ mode: "select" }, () => {})
                  .with({ mode: "review" }, () => setStep({ mode: "select" }))
                  .with({ mode: "verify" }, (s) =>
                    setStep({ mode: "review", producer: s.producer })
                  )
                  .with({ mode: "submit" }, (s) =>
                    setStep({ mode: "verify", producer: s.producer })
                  )
                  .exhaustive()
              }
            >
              Back
            </Button>
            {step.mode === "review" ? (
              <Button
                onClick={() =>
                  setStep({ mode: "verify", producer: step.producer })
                }
              >
                Continue
              </Button>
            ) : (
              <Button
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function VerificationCard({
  title,
  text,
  setStep,
  step,
  verification,
}: {
  title: string;
  text?: ReactNode;
  setStep: StepSetter;
  step: Exclude<Step, { mode: "select" }>;
  verification: ProducerClaimVerificationMethods;
}) {
  return (
    <Card className="p-2 flex flex-row items-center justify-between">
      <div className="flex flex-col gap-2">
        <p className="font-bold">{title}</p>
        {text}
      </div>
      <div>
        <Button
          onClick={() =>
            setStep({
              mode: "submit",
              producer: step.producer,
              verification: verification,
            })
          }
        >
          Select
        </Button>
      </div>
    </Card>
  );
}
