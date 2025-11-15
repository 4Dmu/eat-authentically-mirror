"use client";
import { PRODUCER_TYPES } from "@ea/shared/constants";
import { Button } from "@ea/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ea/ui/card";
import { Input } from "@ea/ui/input";
import { Label } from "@ea/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ea/ui/select";
import { Textarea } from "@ea/ui/textarea";
import {
  type ProducerTypes,
  registerProducerArgsValidator,
} from "@ea/validators/producers";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useCreateProducer } from "@/client/data";
import { AppWrapper } from "@/components/app-wrapper";
import { FieldInfo } from "@/components/forms/helpers/field-info";

export default function Page() {
  const router = useRouter();
  const addProducer = useCreateProducer({
    onSuccess(e) {
      router.push(`/producers/${e}`);
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
      addProducer.mutate(value);
    },
  });

  return (
    <AppWrapper
      crumbs={[
        { url: "/", name: "EA Admin" },
        { url: "/producers", name: "Producers" },
      ]}
      end="Add Producer"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Add Producer</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-5">
              <form.Field name="name">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label>
                      Proucer Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter your form, ranch or business name"
                      onBlur={field.handleBlur}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="type">
                {(field) => (
                  <div className="flex flex-col gap-2">
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
                  <div className="flex flex-col gap-2">
                    <Label>
                      About Your Business{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      placeholder="Tell customers about your farm, ranch or eatery. What makes you special? What are your practices and values?"
                      onBlur={field.handleBlur}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex w-full justify-end">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    className="w-40"
                    disabled={addProducer.isPending || isSubmitting}
                  >
                    Create
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppWrapper>
  );
}
