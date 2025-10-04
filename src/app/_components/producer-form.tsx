import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { RefObject } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { env } from "@/env";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { submitListing } from "@/backend/rpc/waitlist";
import { submitListingArgs } from "@/backend/validators/waitlist";
import { FieldInfo } from "@/components/forms/helpers/field-info";

export function ProducerForm({
  ref,
}: {
  ref: RefObject<HTMLInputElement | null>;
}) {
  const router = useRouter();
  const submitListingMutation = useMutation({
    mutationKey: ["submit-listing"],
    mutationFn: async (args: typeof submitListingArgs.inferIn) =>
      await submitListing(args),
    onError: (e) => toast.error(e.message),
    onSuccess: () => router.push("/listing-waitlist-success"),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      address: undefined as unknown as string,
      type: undefined as unknown as "farm" | "ranch" | "eatery",
      turnstileToken: undefined as unknown as string,
    } as {
      name: string;
      email: string;
      type: "farm" | "ranch" | "eatery";
      turnstileToken: string;
      address: string;
      phone?: string | undefined;
      website?: string | undefined;
      account?:
        | {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
          }
        | undefined;
    },
    validators: {
      onSubmit: ({ formApi }) =>
        formApi.parseValuesWithSchema(submitListingArgs),
    },
    onSubmit: ({ value }) => submitListingMutation.mutate(value),
    onSubmitInvalid: ({ value }) => console.log(value),
  });

  return (
    <Card className="w-full" id="producer">
      <CardHeader>
        <CardTitle className="text-3xl font-fraunces">
          For those who grow and serve authentic food.
        </CardTitle>
        <CardDescription>
          Connect with conscious eaters who are looking for what you do best.
          Add your farm, ranch, or eatery today—if you&apos;re already on our
          map, we&apos;ll update your info and mark your listing as yours.{" "}
          <span className="text-xs text-red-500">* (pending verification)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className=" flex flex-col gap-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label>Listing Name</Label>
                <Input
                  ref={ref}
                  placeholder="Rocky Mountain Farms"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="type">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label>Listing Type</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(e) => field.handleChange(e as "farm")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farm">Farm</SelectItem>
                    <SelectItem value="ranch">Ranch</SelectItem>
                    <SelectItem value="eatery">Eatery</SelectItem>
                  </SelectContent>
                </Select>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label>
                  Email (This will be used to claim your listing after launch)
                </Label>
                <Input
                  placeholder="johndoe@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="phone">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label>Phone (Optional)</Label>
                <Input
                  placeholder="+15554442222"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.currentTarget.value === ""
                        ? undefined
                        : e.currentTarget.value
                    )
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="website">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label>Website (Optional)</Label>
                <Input
                  placeholder="https://www.example.com"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.currentTarget.value === ""
                        ? undefined
                        : e.currentTarget.value
                    )
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="address">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label>Address</Label>
                <Input
                  placeholder="192 Farm Road, FunkyTown, Ohio, United States"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="account">
            {(field) => (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex gap-2">
                      <Label>Pre make account</Label>
                      <Checkbox
                        checked={field.state.value !== undefined}
                        onCheckedChange={(e) =>
                          field.handleChange(
                            e
                              ? {
                                  firstName: undefined as unknown as string,
                                  lastName: undefined as unknown as string,
                                  email: undefined as unknown as string,
                                  password: undefined as unknown as string,
                                }
                              : undefined
                          )
                        }
                      />
                    </div>
                    <CardDescription>
                      By pre making your account you can sign in directly after
                      launch.
                    </CardDescription>
                  </CardHeader>
                  {field.state.value !== undefined && (
                    <CardContent className="flex flex-col gap-3">
                      <form.Field name="account.firstName">
                        {(field) => (
                          <div className="flex flex-col gap-2">
                            <Label>First name</Label>
                            <Input
                              placeholder="Dave"
                              value={field.state.value ?? ""}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.currentTarget.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="account.lastName">
                        {(field) => (
                          <div className="flex flex-col gap-2">
                            <Label>Last name</Label>
                            <Input
                              placeholder="Swimmer"
                              value={field.state.value ?? ""}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.currentTarget.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="account.email">
                        {(field) => (
                          <div className="flex flex-col gap-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              placeholder="johndoe@example.com"
                              value={field.state.value ?? ""}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.currentTarget.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="account.password">
                        {(field) => (
                          <div className="flex flex-col gap-2">
                            <Label>Password</Label>
                            <Input
                              type="password"
                              value={field.state.value ?? ""}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.currentTarget.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        )}
                      </form.Field>
                    </CardContent>
                  )}
                </Card>
              </>
            )}
          </form.Field>
          <form.Field name="turnstileToken">
            {(field) => (
              <>
                <Turnstile
                  siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={field.handleChange}
                />
                <FieldInfo field={field} />
              </>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                disabled={isSubmitting || submitListingMutation.isPending}
              >
                Submit
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
