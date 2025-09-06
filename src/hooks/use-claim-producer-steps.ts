import {
  PublicProducer,
  ProducerClaimVerificationMethods,
} from "@/backend/validators/producers";
import { type } from "arktype";
import { useState } from "react";

type NeededProducer = Pick<
  PublicProducer,
  "contact" | "id" | "name" | "socialMedia" | "address"
>;

export type InputStep =
  | { mode: "select" }
  | { mode: "review"; producer: NeededProducer }
  | { mode: "verify"; producer: NeededProducer }
  | {
      mode: "submit";
      producer: NeededProducer;
      verification: ProducerClaimVerificationMethods;
    };

export type Step =
  | { mode: "select" }
  | { mode: "review"; producer: NeededProducer }
  | { mode: "verify"; producer: NeededProducer }
  | {
      mode: "submit";
      producer: NeededProducer;
      verification:
        | {
            method: Extract<
              ProducerClaimVerificationMethods,
              "contact-email-link"
            >;
            email: string;
          }
        | {
            method: Extract<
              ProducerClaimVerificationMethods,
              "domain-email-link"
            >;
            domain: string;
          }
        | {
            method: Extract<ProducerClaimVerificationMethods, "domain-dns">;
            domain: string;
          }
        | {
            method: Extract<
              ProducerClaimVerificationMethods,
              "contact-phone-link"
            >;
            phone: string;
          }
        | {
            method: Extract<ProducerClaimVerificationMethods, "social-post">;
            socialProfiles: string[];
          }
        | { method: Extract<ProducerClaimVerificationMethods, "manual"> };
    };

export type StepSetter = (step: InputStep) =>
  | "success"
  | {
      error: string;
    };

export function useClaimProducerSteps(initialStep?: Step) {
  const [currentStep, setCurrentStep] = useState<Step>(
    initialStep ?? { mode: "select" },
  );
  const [choosenSocialHandle, setChoosenSocialHandle] = useState<
    string | undefined
  >(undefined);
  const [domainEmailPart, setDomainEmailPart] = useState<string | undefined>(
    undefined,
  );
  const [manualContactEmail, setManualContactEmail] = useState<
    string | undefined
  >(undefined);

  function setStep(step: InputStep): "success" | { error: string } {
    if (currentStep.mode === "submit") {
      setChoosenSocialHandle(undefined);
      setDomainEmailPart(undefined);
    }

    switch (step.mode) {
      case "select":
        setCurrentStep(step);
        return "success";
      case "review":
        setCurrentStep(step);
        return "success";
      case "verify":
        setCurrentStep(step);
        return "success";
      case "submit":
        switch (step.verification) {
          case "contact-email-link":
            const email = type("string.email")(
              step.producer.contact?.email?.trim(),
            );

            if (email instanceof type.errors) {
              return { error: "Missing or invalid contact email" };
            }

            setCurrentStep({
              mode: "submit",
              producer: step.producer,
              verification: {
                method: step.verification,
                email: email,
              },
            });
            return "success";
          case "domain-dns":
          case "domain-email-link":
            const website = step.producer.contact?.website;
            if (!website) {
              return { error: "Missing or invalid website" };
            }

            const url = new URL(website);
            let host = url.hostname;
            console.log(host);
            if (/\..*\./.test(host)) {
              console.log("match");
              host = host.substring(host.indexOf(".") + 1);
            }

            setCurrentStep({
              mode: "submit",
              producer: step.producer,
              verification: {
                method: step.verification,
                domain: host,
              },
            });

            return "success";
          case "contact-phone-link":
            const phone = step.producer.contact?.phone;

            if (!phone) {
              return { error: "Missing or invalid contact phone" };
            }

            setCurrentStep({
              mode: "submit",
              producer: step.producer,
              verification: {
                method: step.verification,
                phone: phone,
              },
            });
            return "success";
          case "social-post":
            const profiles: string[] = [];

            if (step.producer.socialMedia.facebook) {
              profiles.push(step.producer.socialMedia.facebook);
            }
            if (step.producer.socialMedia.instagram) {
              profiles.push(step.producer.socialMedia.instagram);
            }
            if (step.producer.socialMedia.twitter) {
              profiles.push(step.producer.socialMedia.twitter);
            }

            if (profiles.length === 0) {
              return { error: "Must have at least 1 social profile." };
            }

            setCurrentStep({
              mode: "submit",
              producer: step.producer,
              verification: {
                method: step.verification,
                socialProfiles: profiles,
              },
            });
            return "success";
          case "manual":
            setCurrentStep({
              mode: "submit",
              producer: step.producer,
              verification: {
                method: step.verification,
              },
            });
            return "success";
        }
    }
  }

  const submissionRequiresData =
    currentStep.mode === "submit" &&
    ((currentStep.verification.method === "domain-email-link" &&
      domainEmailPart === undefined) ||
      (currentStep.verification.method === "social-post" &&
        choosenSocialHandle === undefined) ||
      (currentStep.verification.method === "manual" &&
        manualContactEmail === undefined));

  return {
    step: currentStep,
    setStep: setStep,
    submitState: {
      submissionRequiresData,
      domainEmailPart: domainEmailPart,
      setDomainEmailPart: setDomainEmailPart,
      choosenSocialHandle,
      setChoosenSocialHandle,
      manualContactEmail,
      setManualContactEmail,
    },
  };
}
