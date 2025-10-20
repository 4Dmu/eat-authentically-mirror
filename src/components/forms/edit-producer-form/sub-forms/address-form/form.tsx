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
import { FieldInfo } from "../../../helpers/field-info";
import { COUNTRIES } from "@/utils/contries";
import { withForm, defaultOptions } from "./context";

export const Form = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
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
            <form.Field name="locality">
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
              <form.Field name="city">
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
              <form.Field name="postcode">
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
              <form.Field name="adminArea">
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

              <form.Field name="country">
                {(subField) => (
                  <div className="flex flex-col gap-3">
                    <Label>Country</Label>
                    <Select
                      onValueChange={(e) => subField.handleChange(e as "usa")}
                      value={subField.state.value ?? undefined}
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
            <div className="grid grid-cols-2 gap-3">
              <form.Field name="latitude">
                {(subField) => (
                  <div className="flex flex-col gap-3">
                    <Label>Lattitude</Label>
                    <Input
                      type="number"
                      onBlur={subField.handleBlur}
                      placeholder="12.44"
                      value={
                        Number.isNaN(subField.state.value) ||
                        !subField.state.value
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
                          (Number.isNaN(subField.state.value) ||
                            subField.state.value === undefined)
                        ) {
                          subField.handleChange(undefined);
                        } else {
                          subField.handleChange(value);
                        }
                      }}
                    />
                    <FieldInfo field={subField} />
                  </div>
                )}
              </form.Field>
              <form.Field name="longitude">
                {(subField) => (
                  <div className="flex flex-col gap-3">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      placeholder="-12.44"
                      onBlur={subField.handleBlur}
                      value={
                        Number.isNaN(subField.state.value) ||
                        !subField.state.value
                          ? ""
                          : subField.state.value
                      }
                      onChange={(e) => {
                        const value = e.currentTarget.valueAsNumber;

                        if (
                          Number.isNaN(value) &&
                          (Number.isNaN(subField.state.value) ||
                            subField.state.value === undefined)
                        ) {
                          subField.handleChange(undefined);
                        } else {
                          subField.handleChange(value);
                        }
                      }}
                    />
                    <FieldInfo field={subField} />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>
      </>
    );
  },
});
