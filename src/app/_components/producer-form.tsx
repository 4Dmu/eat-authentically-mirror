import { submitListingArgs } from "@/backend/validators";
import { FieldInfo } from "@/components/field-info";
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
import { RefObject, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { env } from "@/env";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProducerForm({
  ref,
}: {
  ref: RefObject<HTMLInputElement | null>;
}) {
  const router = useRouter();
  // const waitlistRegisterMutation = useMutation({
  //   mutationKey: ["waitlist-register"],
  //   mutationFn: async (args: typeof waitlistRegisterArgs.infer) =>
  //     await waitlistRegister(args),
  //   onError: (e) => toast.error(e.message),
  //   onSuccess: () => router.push("/waitlist-success"),
  // });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: undefined as string | undefined,
      website: undefined as string | undefined,
      address: undefined as unknown as string,
      type: "farm" as "farm" | "ranch" | "eatery",
      turnstileToken: undefined as unknown as string,
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(submitListingArgs),
    },
    // onSubmit: ({ value }) => waitlistRegisterMutation.mutate(value),
    onSubmit: ({ value }) => console.log(value),
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
          Add your farm, ranch, or eatery today—if you’re already on our map,
          we’ll update your info and mark your listing as yours.{" "}
          <span className="text-xs text-red-500">* (pending verification)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className=" flex flex-col gap-2"
        >
          <form.Field name="name">
            {(field) => (
              <div>
                <Input
                  ref={ref}
                  placeholder="Listing name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="type">
            {(field) => (
              <div>
                <Select
                  value={field.state.value}
                  onValueChange={(e) => field.handleChange(e as "farm")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farm">Farm</SelectItem>
                    <SelectItem value="ranch">Ranch</SelectItem>
                    <SelectItem value="eaterie">Eaterie</SelectItem>
                  </SelectContent>
                </Select>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <div>
                <Input
                  placeholder="Email"
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
              <div>
                <Input
                  placeholder="Phone"
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
              <div>
                <Input
                  placeholder="Website"
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
              <div>
                <Input
                  placeholder="Address"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo field={field} />
              </div>
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
          <Button>Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
}
