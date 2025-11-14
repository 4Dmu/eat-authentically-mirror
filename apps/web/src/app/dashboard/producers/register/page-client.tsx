"use client";
import { Button } from "@ea/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ea/ui/card";
import { Input } from "@ea/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ea/ui/select";
import { Textarea } from "@ea/ui/textarea";
import {
  PRODUCER_TYPES,
  registerProducerArgsValidator,
  RegisterProducerArgs,
  ProducerTypes,
} from "@ea/validators/producers";
import { useMutation } from "@tanstack/react-query";
import { registerProducer } from "@/backend/rpc/producers";
import { BackButton } from "@/components/back-button";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Label } from "@ea/ui/label";
import { FieldInfo } from "@/components/forms/helpers/field-info";

export function ClientPage() {
  const router = useRouter();
  const registerProducerMutation = useMutation({
    mutationKey: ["register-producer"],
    mutationFn: async (data: RegisterProducerArgs) => {
      return await registerProducer(data);
    },
    onSuccess: () => {
      router.push("/organization/subscribe");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      about: "",
      type: undefined as unknown as ProducerTypes,
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(registerProducerArgsValidator),
    },
    onSubmit({ value }) {
      registerProducerMutation.mutate(value);
    },
  });

  return (
    <div className="p-10 flex flex-col gap-5 mx-auto max-w-7xl">
      <BackButton text="Back To Home" href="/" />
      <h1 className="font-bold">Become a Producer</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-5"
      >
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your business</CardTitle>
            <CardDescription>
              Help customers find and connect with you by providing these
              details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <form.Field name="name">
              {(field) => (
                <div>
                  <Label>
                    Proucer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter your form, ranch or business name"
                    onBlur={field.handleBlur}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="type">
              {(field) => (
                <div>
                  <Label>
                    Business Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(e) =>
                      field.handleChange(e as ProducerTypes)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {PRODUCER_TYPES.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="about">
              {(field) => (
                <div>
                  <Label>
                    About Your Business <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Tell customers about your farm, ranch or eatery. What makes you special? What are your practices and values?"
                    onBlur={field.handleBlur}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>
        <div className="flex w-full justify-end">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                className="w-40"
                disabled={registerProducerMutation.isPending || isSubmitting}
              >
                Create
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
