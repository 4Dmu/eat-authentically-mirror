import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React from "react";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "../../helpers/field-info";
import { editListingFormContactValidator } from "@/backend/validators/listings";
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

export const contactOpts = formOptions({
  defaultValues: {
    email:
      undefined as unknown as (typeof editListingFormContactValidator.infer)["email"],
    phone:
      undefined as unknown as (typeof editListingFormContactValidator.infer)["phone"],
    website:
      undefined as unknown as (typeof editListingFormContactValidator.infer)["website"],
  },
});

export const useContactForm = useAppForm;

export const ContactForm = withForm({
  ...contactOpts,
  render: function ({ form }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="gap-5 flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="phone">
              {(subField) => (
                <div className="flex flex-col gap-3">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 (555) 123-4567"
                    onBlur={subField.handleBlur}
                    value={subField.state.value ?? ""}
                    onChange={(e) =>
                      subField.handleChange(
                        (e.target.value.length === 0
                          ? undefined
                          : e.currentTarget.value) as string
                      )
                    }
                  />
                  <FieldInfo field={subField} />
                </div>
              )}
            </form.Field>
            <form.Field name="email">
              {(subField) => (
                <div className="flex flex-col gap-3">
                  <Label>Business Email</Label>
                  <Input
                    placeholder="contact@yourform.com"
                    onBlur={subField.handleBlur}
                    value={subField.state.value ?? ""}
                    onChange={(e) =>
                      subField.handleChange(
                        (e.target.value.length === 0
                          ? undefined
                          : e.currentTarget.value) as string
                      )
                    }
                  />
                  <FieldInfo field={subField} />
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="website">
            {(subField) => (
              <div className="flex flex-col gap-3">
                <Label>Website</Label>
                <Input
                  placeholder="https://your-website.com"
                  onBlur={subField.handleBlur}
                  value={subField.state.value ?? ""}
                  onChange={(e) =>
                    subField.handleChange(
                      (e.target.value.length === 0
                        ? undefined
                        : e.currentTarget.value) as string
                    )
                  }
                />
                <FieldInfo field={subField} />
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    );
  },
});
