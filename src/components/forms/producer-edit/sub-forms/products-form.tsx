import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";

import { editListingFormProductsValidator } from "@/backend/validators/listings";
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

export const productsOpts = formOptions({
  defaultValues: {
    products: [],
  } satisfies typeof editListingFormProductsValidator.infer as typeof editListingFormProductsValidator.infer,
});

export const useProductsForm = useAppForm;

export const ProductsForm = withForm({
  ...productsOpts,
  render: function ({}) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Add a product..." />
            <Button size={"icon"}>
              <PlusIcon />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
});
