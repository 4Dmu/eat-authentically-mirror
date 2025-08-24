import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

export const addressOpts = formOptions({
  defaultValues: {
    city: undefined as unknown as (typeof editListingFormAddressValidator.infer)["city"],
    state:
      undefined as unknown as (typeof editListingFormAddressValidator.infer)["state"],
    street:
      undefined as unknown as (typeof editListingFormAddressValidator.infer)["street"],
    coordinate:
      undefined as unknown as (typeof editListingFormAddressValidator.infer)["coordinate"],
    zip: undefined as unknown as (typeof editListingFormAddressValidator.infer)["zip"],
  },
});

export const useAddressForm = useAppForm;

export const AddressForm = withForm({
  ...addressOpts,
  render: function ({ form }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="gap-5 flex flex-col">
          <form.Field name="street">
            {(subField) => (
              <div className="flex flex-col gap-3">
                <Label>Street Address</Label>
                <Input
                  onBlur={subField.handleBlur}
                  value={subField.state.value ?? ""}
                  onChange={(e) => subField.handleChange(e.currentTarget.value)}
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
            <form.Field name="zip">
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
            <form.Field name="state">
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

            <div className="flex flex-col gap-3">
              <Label>Country</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farm">Farm</SelectItem>
                  <SelectItem value="ranch">Ranch</SelectItem>
                  <SelectItem value="eatery">Eatery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <form.Field name="coordinate">
            {(field) => (
              <div className="grid grid-cols-2 gap-3">
                <form.Field name="coordinate.latitude">
                  {(subField) => (
                    <div className="flex flex-col gap-3">
                      <Label>Lattitude</Label>
                      <Input
                        type="number"
                        onBlur={subField.handleBlur}
                        value={
                          Number.isNaN(subField.state.value) ||
                          subField.state.value === undefined
                            ? ""
                            : subField.state.value
                        }
                        onChange={(e) => {
                          const value = e.currentTarget.valueAsNumber;
                          field.handleChange({
                            ...field.state.value,
                            latitude: value,
                          });
                        }}
                      />
                      <FieldInfo field={subField} />
                    </div>
                  )}
                </form.Field>
                <form.Field name="coordinate.longitude">
                  {(subField) => (
                    <div className="flex flex-col gap-3">
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        onBlur={subField.handleBlur}
                        value={
                          Number.isNaN(subField.state.value) ||
                          subField.state.value === undefined
                            ? ""
                            : subField.state.value
                        }
                        onChange={(e) => {
                          const value = e.currentTarget.valueAsNumber;
                          field.handleChange({
                            ...field.state.value,
                            longitude: value,
                          });
                        }}
                      />
                      <FieldInfo field={subField} />
                    </div>
                  )}
                </form.Field>
                {JSON.stringify(field.state.value)}
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    );
  },
});
