import { Button } from "@ea/ui/button";
import type { AnyFormApi } from "@tanstack/react-form";
import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function SaveButton({
  forms,
  disableSubmit,
  disableReset,
}: {
  forms: AnyFormApi[];
  disableSubmit?: boolean;
  disableReset?: boolean;
}) {
  const [formStates, setFormStates] = useState<
    (
      | { isDirty: boolean; isValid: boolean; isDefaultValue: boolean }
      | undefined
    )[]
  >([]);

  const show = formStates.some((s) => s && !s.isDefaultValue);
  const hasOneValid = formStates.some((s) => s?.isValid);

  function reset() {
    forms.forEach((f) => {
      f.reset();
    });
  }

  function submit() {
    forms.forEach(async (f) => {
      if (f.state.isDirty) {
        await f.handleSubmit();
        f.reset();
      }
    });
  }

  useEffect(() => {
    const unsubs = forms.map((form, i) =>
      form.store.subscribe((state) => {
        setFormStates((prev) => {
          const next = [...prev];
          next[i] = {
            isDirty: state.currentVal.isDirty,
            isValid: state.currentVal.isValid,
            isDefaultValue: state.currentVal.isDefaultValue,
          };
          return next;
        });
      }),
    );

    return () =>
      unsubs.forEach((u) => {
        u();
      });
  }, [forms]);

  return (
    <>
      {show && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-10 max-sm:flex-col items-center p-2 bg-card shadow-lg rounded-lg border sm:w-full sm:max-w-sm flex gap-2">
          <div className="flex gap-2 text-muted-foreground items-center">
            <InfoIcon size={20} />
            <p>Unsaved changes</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:ml-auto">
            <Button
              disabled={disableReset}
              onClick={reset}
              variant={"destructive"}
            >
              Reset
            </Button>
            <Button disabled={disableSubmit || !hasOneValid} onClick={submit}>
              Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
