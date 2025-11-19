import { Card, CardContent, CardHeader, CardTitle } from "@ea/ui/card";
import { Input } from "@ea/ui/input";
import { Label } from "@ea/ui/label";
import { FieldInfo } from "./../helpers/field-info";
import { defaultOptions, withForm } from "./context";

export const Form = withForm({
  ...defaultOptions,
  render: ({ form }) => (
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
                      e.target.value.length === 0 ? null : e.currentTarget.value
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
                      e.target.value.length === 0 ? null : e.currentTarget.value
                    )
                  }
                />
                <FieldInfo field={subField} />
              </div>
            )}
          </form.Field>
        </div>
        <form.Field name="websiteUrl">
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
  ),
});
