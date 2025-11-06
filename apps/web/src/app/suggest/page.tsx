"use client";
import { suggestProducerArgs } from "@ea/validators/producers";
import { FieldInfo } from "@/components/forms/helpers/field-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/utils/contries";
import { useSuggestProducer } from "@/utils/producers";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const suggestProducer = useSuggestProducer({
    onSuccess() {
      toast.success("Suggestion Added");
      form.reset();
      router.push("/");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      type: undefined,
      address: undefined,
    } as unknown as typeof suggestProducerArgs.inferIn,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(suggestProducerArgs),
    },
    onSubmit: ({ value }) => suggestProducer.mutate(value),
  });

  return (
    <div className="flex flex-col p-10 items-center">
      <div className="max-w-3xl">
        <div className="p-10 flex flex-col gap-5 items-center text-center">
          <h1 className="font-bold text-5xl">Suggest A Producer</h1>
          <p>
            Know a Farm/Ranch/Eatery that you like but isn&apos;t listed here?
            Suggest it and we&apos;ll add it (afer review)
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Producer Info</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="flex flex-col gap-5"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <form.Field name="name">
                  {(field) => (
                    <div className="flex flex-col gap-3">
                      <Label>Name</Label>
                      <Input
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldInfo
                        overrideMessage="Name is required"
                        field={field}
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name="type">
                  {(field) => (
                    <div className="flex flex-col gap-3">
                      <Label>Type</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(e) => field.handleChange(e as "farm")}
                      >
                        <SelectTrigger
                          onBlur={field.handleBlur}
                          className="w-full"
                        >
                          <SelectValue placeholder="Farm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="farm">Farm</SelectItem>
                          <SelectItem value="ranch">Ranch</SelectItem>
                          <SelectItem value="eatery">Eatery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldInfo
                        overrideMessage="Type must be farm, ranch or eatery"
                        field={field}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <form.Field name="email">
                  {(field) => (
                    <div className="flex flex-col gap-3">
                      <Label>Email</Label>
                      <Input
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value === ""
                              ? undefined
                              : e.currentTarget.value
                          )
                        }
                      />
                      <FieldInfo
                        overrideMessage="Must a valid email or phone"
                        field={field}
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name="phone">
                  {(field) => (
                    <div className="flex flex-col gap-3">
                      <Label>Phone</Label>
                      <Input
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value === ""
                              ? undefined
                              : e.currentTarget.value
                          )
                        }
                      />
                      <FieldInfo
                        overrideMessage="Must a valid phone or email"
                        field={field}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
              <form.Field name="address">
                {(field) => (
                  <Card>
                    <CardContent className="gap-5 flex flex-col">
                      <form.Field name="address.street">
                        {(subField) => (
                          <div className="flex flex-col gap-3">
                            <Label>Street Address</Label>
                            <Input
                              placeholder="123 Farm Road"
                              onBlur={subField.handleBlur}
                              value={subField.state.value ?? ""}
                              onChange={(e) =>
                                subField.handleChange(e.currentTarget.value)
                              }
                            />
                            <FieldInfo
                              overrideMessage="Street is required"
                              field={subField}
                            />
                          </div>
                        )}
                      </form.Field>

                      <div className="grid grid-cols-2 gap-3">
                        <form.Field name="address.city">
                          {(subField) => (
                            <div className="flex flex-col gap-3">
                              <Label>City</Label>
                              <Input
                                placeholder="Springfield"
                                onBlur={subField.handleBlur}
                                value={subField.state.value ?? ""}
                                onChange={(e) =>
                                  subField.handleChange(e.currentTarget.value)
                                }
                              />
                              <FieldInfo
                                overrideMessage="City is required"
                                field={subField}
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="address.zip">
                          {(subField) => (
                            <div className="flex flex-col gap-3">
                              <Label>Postal Code</Label>
                              <Input
                                placeholder="123"
                                onBlur={subField.handleBlur}
                                value={subField.state.value ?? ""}
                                onChange={(e) =>
                                  subField.handleChange(e.currentTarget.value)
                                }
                              />
                              <FieldInfo
                                overrideMessage="Zip is required"
                                field={subField}
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <form.Field name="address.state">
                          {(subField) => (
                            <div className="flex flex-col gap-3">
                              <Label>State</Label>
                              <Input
                                placeholder="Texas"
                                onBlur={subField.handleBlur}
                                value={subField.state.value ?? ""}
                                onChange={(e) =>
                                  subField.handleChange(e.currentTarget.value)
                                }
                              />
                              <FieldInfo
                                overrideMessage="State is required"
                                field={subField}
                              />
                            </div>
                          )}
                        </form.Field>

                        <form.Field name="address.country">
                          {(subField) => (
                            <div className="flex flex-col gap-3">
                              <Label>Country</Label>
                              <Select
                                onValueChange={(e) =>
                                  subField.handleChange(e as "usa")
                                }
                                value={subField.state.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {COUNTRIES.map((country) => (
                                    <SelectItem
                                      key={country.alpha3}
                                      value={country.alpha3}
                                    >
                                      {country.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FieldInfo
                                overrideMessage="Country is required"
                                field={subField}
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>
                      <FieldInfo
                        overrideMessage="Address is required"
                        field={field}
                      />
                    </CardContent>
                  </Card>
                )}
              </form.Field>
              <p>
                Free users can suggest one producer per day while payed users
                can suggest 3.
              </p>
              <Button disabled={suggestProducer.isPending}>Suggest</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
