import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React from "react";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "../../helpers/field-info";
import { emptyOptions, withForm } from "../form";

export const ContactForm = withForm({
  ...emptyOptions,
  render: function ({ form }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="gap-5 flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="contact.phone">
              {(subField) => (
                <div className="flex flex-col gap-3">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 (555) 123-4567"
                    onBlur={subField.handleBlur}
                    value={subField.state.value ?? ""}
                    onChange={(e) =>
                      subField.handleChange(
                        e.target.value.length === 0
                          ? null
                          : e.currentTarget.value
                      )
                    }
                  />
                  <FieldInfo field={subField} />
                </div>
              )}
            </form.Field>
            <form.Field name="contact.email">
              {(subField) => (
                <div className="flex flex-col gap-3">
                  <Label>Business Email</Label>
                  <Input
                    placeholder="contact@yourform.com"
                    onBlur={subField.handleBlur}
                    value={subField.state.value ?? ""}
                    onChange={(e) =>
                      subField.handleChange(
                        e.target.value.length === 0
                          ? null
                          : e.currentTarget.value
                      )
                    }
                  />
                  <FieldInfo field={subField} />
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="contact.website">
            {(subField) => (
              <div className="flex flex-col gap-3">
                <Label>Website</Label>
                <Input
                  placeholder="https://your-website.com"
                  onBlur={subField.handleBlur}
                  value={subField.state.value ?? ""}
                  onChange={(e) =>
                    subField.handleChange(
                      e.target.value.length === 0 ? null : e.currentTarget.value
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
