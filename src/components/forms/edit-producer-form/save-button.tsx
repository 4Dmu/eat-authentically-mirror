import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { AnyFormApi } from "@tanstack/react-form";
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
    { isDirty: boolean; isValid: boolean; isDefaultValue: boolean }[]
  >([]);

  const show = formStates.some((s) => !s.isDefaultValue);
  const hasOneValid = formStates.some((s) => s.isValid);

  function reset() {
    forms.forEach((f) => f.reset());
  }

  function submit() {
    forms.forEach((f) => f.handleSubmit());
  }

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const unsub = form.store.subscribe((state) => {
        formStates[i] = {
          isDirty: state.currentVal.isDirty,
          isValid: state.currentVal.isValid,
          isDefaultValue: state.currentVal.isDefaultValue,
        };
        setFormStates([...formStates]);
      });
      unsubs.push(unsub);
    }
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [forms, formStates]);

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
