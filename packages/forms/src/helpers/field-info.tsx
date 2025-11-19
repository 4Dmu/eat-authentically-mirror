import { type AnyFieldApi, type AnyFormApi, useStore } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { match, P } from "ts-pattern";

export function FieldInfo({
  field,
  otherwise,
  overrideMessage,
}: {
  field: AnyFieldApi;
  otherwise?: ReactNode;
  overrideMessage?: string;
}) {
  return (
    <>
      {!field.state.meta.isValid ? (
        <em className="text-destructive text-sm">
          {overrideMessage ??
            field.state.meta.errors
              .map((err) =>
                match(err)
                  .with({ message: P.string }, (v) => v.message)
                  .otherwise((v) => v)
              )
              .join(",")}
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
