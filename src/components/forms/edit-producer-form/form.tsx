import { editListingFormValidator } from "@/backend/validators/listings";
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

export const emptyOptions = formOptions({
  defaultValues: {
    name: "",
    type: "farm",
    about: null,
    address: {},
    contact: {},
    images: {
      primaryImgId: null,
      items: [],
    },
    commodities: [],
    certifications: [],
    video: null,
    socialMedia: null,
  } satisfies typeof editListingFormValidator.infer as typeof editListingFormValidator.infer,
});
