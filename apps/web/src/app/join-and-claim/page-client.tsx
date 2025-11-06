"use client";
import { submitAccountDetailsForClaimInvitation } from "@/backend/rpc/claim-invitations";
import {
  SubmitClaimInvitationAccountDetails,
  submitClaimInvitationAccountDetails,
} from "@ea/validators/claim-invitations";
import { FieldInfo } from "@/components/forms/helpers/field-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type zxcvbn from "zxcvbn";

export function JoinPage({
  token,
  producer,
}: {
  token: string;
  producer: { id: string; name: string };
}) {
  const router = useRouter();
  const [serverPasswordError, setServerPasswordError] =
    useState<zxcvbn.ZXCVBNFeedback>();
  const [passwordSnapshot, setPasswordSnapshot] = useState<string>();

  const submitClaimInvitationMt = useMutation({
    mutationKey: ["submit-claim-invitation"],
    mutationFn: async (value: SubmitClaimInvitationAccountDetails) => {
      return await submitAccountDetailsForClaimInvitation({
        token,
        accountDetails: value,
      });
    },
    onMutate: () => {
      setServerPasswordError(undefined);
      setPasswordSnapshot(undefined);
    },
    onError: (e) => toast.error(e.message),
    onSuccess: (result) => {
      console.log(result);
      if (result.status === "error") {
        if (result.passwordError) {
          setServerPasswordError(result.passwordError);
          setPasswordSnapshot(form.getFieldValue("password"));
        } else {
          toast.error(result.message);
        }
      } else {
        router.replace(`/sign-in-with-token?token=${result.signInToken}`);
      }
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: undefined as unknown as string,
      confirmPassword: undefined as unknown as string,
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(submitClaimInvitationAccountDetails),
    },
    onSubmit: ({ value }) => submitClaimInvitationMt.mutate(value),
  });

  return (
    <div className="flex justify-center">
      <div className="p-5 sm:p-10 md:p-20 flex flex-col gap-10 max-w-3xl break-all">
        <h1 className="font-bold text-5xl text-center">
          Join EatAuthentically
        </h1>
        <p className="text-center">
          You received and invitation email to claim your listing &quot;
          {producer.name}&quot; on EatAuthentically, simply setup your account
          details to complete the claim proccess.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>User Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-2 gap-2">
                <form.Field name="firstName">
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Label>First Name</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.currentTarget.value)
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
                <form.Field name="lastName">
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Label>Last Name</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.currentTarget.value)
                        }
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
              <form.Field name="email">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label>Email</Label>
                    <Input
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="password">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label>Password</Label>
                    <Input
                      value={field.state.value ?? ""}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                      type="password"
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                    {field.state.value === passwordSnapshot && (
                      <>
                        {serverPasswordError?.warning && (
                          <p className="text-sm text-destructive">
                            {serverPasswordError.warning}
                          </p>
                        )}
                        {serverPasswordError?.suggestions.map(
                          (suggestion, i) => (
                            <p className="text-sm text-brand-green" key={i}>
                              {suggestion}
                            </p>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="confirmPassword">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label>Confirm Password</Label>
                    <Input
                      value={field.state.value ?? ""}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                      type="password"
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <Button>Submit</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
