import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "../../../helpers/field-info";
import { defaultOptions, withForm } from "./context";

export const Form = withForm({
  ...defaultOptions,

  render: function Render({ form }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <form.Field name="name">
              {(field) => (
                <div className="flex flex-col gap-3">
                  <Label>Producer Name</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="type">
              {(field) => (
                <div className="flex flex-col gap-3">
                  <Label>Producer Type</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(e) => field.handleChange(e as "farm")}
                  >
                    <SelectTrigger onBlur={field.handleBlur} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farm">Farm</SelectItem>
                      <SelectItem value="ranch">Ranch</SelectItem>
                      <SelectItem value="eatery">Eatery</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="about">
            {(field) => (
              <div className="flex flex-col gap-3">
                <Label>About</Label>
                <Textarea
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    );
  },
});
