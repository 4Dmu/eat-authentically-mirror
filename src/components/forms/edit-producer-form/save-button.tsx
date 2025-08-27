import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { AnyFormApi, useStore } from "@tanstack/react-form";

export function SaveButton({
  form,
  onSubmit,
  disableSubmit,
}: {
  form: AnyFormApi;
  onSubmit: () => void;
  disableSubmit?: boolean;
}) {
  const formState = useStore(
    form.store,
    ({ isDirty, isValid, isDefaultValue }) => ({
      isDirty,
      isValid,
      isDefaultValue,
    })
  );

  return (
    <>
      {!formState.isDefaultValue && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-10 max-sm:flex-col items-center p-2 bg-card shadow-lg rounded-lg border sm:w-full sm:max-w-sm flex gap-2">
          <div className="flex gap-2 text-muted-foreground items-center">
            <InfoIcon size={20} />
            <p>Unsaved changes</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:ml-auto">
            <Button onClick={() => form.reset()} variant={"destructive"}>
              Reset
            </Button>
            <Button
              disabled={disableSubmit || !formState.isValid}
              onClick={onSubmit}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
