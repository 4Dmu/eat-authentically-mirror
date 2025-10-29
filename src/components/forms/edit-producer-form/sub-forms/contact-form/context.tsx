import { editProducerContactFormValditator } from "@/backend/validators/producers";
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
    email: null,
    websiteUrl: null,
    phone: null,
  } as typeof editProducerContactFormValditator.infer as typeof editProducerContactFormValditator.infer,
});
