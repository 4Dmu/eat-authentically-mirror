import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { match } from "ts-pattern";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Certification } from "@/backend/validators/listings";
import { useStore } from "@tanstack/react-form";
import {
  editListingFormBasicInfoValidator,
  editListingFormCertificationsValidator,
} from "@/backend/validators/listings";
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from "@tanstack/react-form";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

export const certificationsOpts = formOptions({
  defaultValues: {
    certifications: [],
  } satisfies typeof editListingFormCertificationsValidator.infer as typeof editListingFormCertificationsValidator.infer,
});

export const useCertificationsForm = useAppForm;

export const CertificationsForm = withForm({
  ...certificationsOpts,
  props: {
    tier: "Free" as SubTier,
    certifications: [] as Certification[],
  },
  render: function ({ form, tier, certifications }) {
    const certificationsFieldValue = useStore(
      form.store,
      (state) => state.values.certifications
    );

    return (
      <Card>
        <CardHeader className="flex justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Certifications</CardTitle>
            <CardDescription>
              Add certifications to showcase your practices and standards.
            </CardDescription>
          </div>
          <div>
            {match(tier)
              .with("Free", () => (
                <span>{certificationsFieldValue?.length ?? 0}/3</span>
              ))
              .with({ tier: "community" }, () => (
                <span>{certificationsFieldValue?.length ?? 0}/3</span>
              ))
              .with({ tier: "pro" }, () => (
                <span>{certificationsFieldValue?.length ?? 0}/5</span>
              ))
              .with({ tier: "premium" }, () => (
                <span>{certificationsFieldValue?.length ?? 0}/10</span>
              ))
              .exhaustive()}
          </div>
        </CardHeader>
        <CardContent>
          {(certificationsFieldValue?.length ?? 0) > 0 && (
            <div>
              <Label>Your Certifications</Label>
              <div>
                {certificationsFieldValue?.map((cert) => (
                  <Badge>{cert.name}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Label>Add Certifications</Label>
            <div className="relative">
              <SearchIcon
                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input className="pl-10" placeholder="Search certifications..." />
            </div>
            <div className="flex flex-wrap">
              {certifications.map((cert) => (
                <Button key={cert.id} variant={"ghost"}>
                  {cert.name}
                  <PlusIcon />
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
});
