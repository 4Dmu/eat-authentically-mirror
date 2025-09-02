import { cn } from "@/lib/utils";
import { AnyFieldApi, AnyFormApi, useStore } from "@tanstack/react-form";
import { ReactNode } from "react";

export function FieldInfo({
  field,
  otherwise,
}: {
  field: AnyFieldApi;
  otherwise?: ReactNode;
}) {
  return (
    <>
      {!field.state.meta.isValid ? (
        <em className="text-destructive">
          {field.state.meta.errors.map((err) => err.message).join(",")}
        </em>
      ) : (
        otherwise
      )}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}

export function FormInfo({ form }: { form: AnyFormApi }) {
  const isValid = useStore(form.store, (s) => s.isValid);
  const errors = useStore(form.store, (s) => s.errors);

  return (
    <>
      {!isValid ? (
        <em className="text-destructive">
          {errors.map((err) => JSON.stringify(err)).join(",")}
        </em>
      ) : null}
    </>
  );
}
