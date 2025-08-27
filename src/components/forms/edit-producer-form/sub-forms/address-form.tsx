import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldInfo } from "../../helpers/field-info";
import { editListingFormAddressValidator } from "@/backend/validators/listings";
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from "@tanstack/react-form";
import { COUNTRIES } from "@/utils/contries";
import { emptyOptions, withForm } from "../form";

export const AddressForm = withForm({
  ...emptyOptions,
  render: function ({ form }) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Your Business Address</CardTitle>
            <CardDescription>
              This is completly optional and is meant to allow people to find
              your business.
            </CardDescription>
          </CardHeader>
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
                  <FieldInfo field={subField} />
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
                    <FieldInfo field={subField} />
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
                    <FieldInfo field={subField} />
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
                    <FieldInfo field={subField} />
                  </div>
                )}
              </form.Field>

              <form.Field name="address.country">
                {(subField) => (
                  <div className="flex flex-col gap-3">
                    <Label>Country</Label>
                    <Select
                      onValueChange={(e) => subField.handleChange(e as "usa")}
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
                    <FieldInfo field={subField} />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Search Location</CardTitle>
            <CardDescription>
              This allows people to find your farm when searching based on
              location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="address.coordinate">
              {(field) => (
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="address.coordinate.latitude">
                    {(subField) => (
                      <div className="flex flex-col gap-3">
                        <Label>Lattitude</Label>
                        <Input
                          type="number"
                          onBlur={subField.handleBlur}
                          placeholder="12.44"
                          value={
                            Number.isNaN(subField.state.value) ||
                            subField.state.value === undefined
                              ? ""
                              : subField.state.value
                          }
                          // onChange={(e) => {
                          //   const value = e.currentTarget.valueAsNumber;
                          //   field.handleChange({
                          //     ...field.state.value,
                          //     latitude: value,
                          //   });
                          // }}
                          onChange={(e) => {
                            const value = e.currentTarget.valueAsNumber;

                            if (
                              Number.isNaN(value) &&
                              (Number.isNaN(field.state.value?.longitude) ||
                                field.state.value?.longitude === undefined)
                            ) {
                              field.handleChange(undefined);
                            } else {
                              subField.handleChange(value);
                            }
                          }}
                        />
                        <FieldInfo field={subField} />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="address.coordinate.longitude">
                    {(subField) => (
                      <div className="flex flex-col gap-3">
                        <Label>Longitude</Label>
                        <Input
                          type="number"
                          placeholder="-12.44"
                          onBlur={subField.handleBlur}
                          value={
                            Number.isNaN(subField.state.value) ||
                            subField.state.value === undefined
                              ? ""
                              : subField.state.value
                          }
                          onChange={(e) => {
                            const value = e.currentTarget.valueAsNumber;

                            if (
                              Number.isNaN(value) &&
                              (Number.isNaN(field.state.value?.latitude) ||
                                field.state.value?.latitude === undefined)
                            ) {
                              field.handleChange(undefined);
                            } else {
                              subField.handleChange(value);
                            }
                          }}
                        />
                        <FieldInfo field={subField} />
                      </div>
                    )}
                  </form.Field>
                  <div className="col-span-2">
                    <FieldInfo field={field} />
                    <p className="text-sm text-muted-foreground">
                      If your not sure what your latitude and longitude you can
                      use the location button to autofill it using your current
                      location.
                    </p>
                  </div>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>
      </>
    );
  },
});
