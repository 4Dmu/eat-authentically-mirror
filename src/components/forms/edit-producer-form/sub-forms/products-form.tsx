import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { emptyOptions, withForm } from "../form";

export const ProductsForm = withForm({
  ...emptyOptions,
  render: function Render({ form }) {
    const [name, setName] = useState("");
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>List the products of your farm.</CardDescription>
        </CardHeader>
        <CardContent>
          {
            <form.Field name="commodities" mode="array">
              {(field) => (
                <div className="flex gap-5 flex-col">
                  <div className="flex flex-wrap gap-2">
                    {field.state.value.map((_, i) => (
                      <form.Field name={`commodities[${i}].name`} key={i}>
                        {(subField) => (
                          <div className="relative" key={i}>
                            <Badge>{subField.state.value}</Badge>
                            <Button
                              onClick={() => field.removeValue(i)}
                              className="absolute -top-1 -right-2 size-4 rounded-full cursor-pointer"
                              variant={"destructive"}
                              size={"icon"}
                            >
                              <XIcon size={3} />
                            </Button>
                          </div>
                        )}
                      </form.Field>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.currentTarget.value)}
                      placeholder="Add a product..."
                    />
                    <Button
                      disabled={name.length === 0}
                      onClick={() => {
                        field.pushValue({ name: name, varieties: [] });
                        setName("");
                      }}
                      size={"icon"}
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                </div>
              )}
            </form.Field>
          }
        </CardContent>
      </Card>
    );
  },
});
