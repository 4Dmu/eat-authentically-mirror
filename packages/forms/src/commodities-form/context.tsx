import type { editProducerCommoditiesFormValidator } from "@ea/validators/producers";
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from "@tanstack/react-form";

// export useFieldContext for use in your custom components
export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  // We'll learn more about these options later
  fieldComponents: {},
  formComponents: {},
});

export const defaultOptions = formOptions({
  defaultValues: {
    commodities: [],
  } satisfies typeof editProducerCommoditiesFormValidator.infer as typeof editProducerCommoditiesFormValidator.infer,
});
