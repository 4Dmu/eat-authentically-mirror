import { Certification } from "@/backend/db/schema";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import {
  editListingFormAddressValidator,
  editListingFormBasicInfoValidator,
  editListingFormCertificationsValidator,
  editListingFormContactValidator,
  editListingFormImagesValidator,
  editListingFormProductsValidator,
  editListingFormVideoValidator,
  type Listing,
} from "@/backend/validators/listings";
import { BasicInfoForm, useBasicInfoForm } from "./sub-forms/basic-info-form";
import { ImagesForm, useImagesForm } from "./sub-forms/images-form";
import { useVideoForm, VideoForm } from "./sub-forms/video-form";
import { ContactForm, useContactForm } from "./sub-forms/contact-form";
import {
  CertificationsForm,
  useCertificationsForm,
} from "./sub-forms/certifications-form";
import { ProductsForm } from "./sub-forms/products-form";
import { AddressForm, useAddressForm } from "./sub-forms/address-form";
import { SaveButton } from "./save-button";

export function ProducerEditForm(props: {
  currentListing: Listing;
  tier: SubTier;
  certifications: Certification[];
}) {
  const basicInfoForm = useBasicInfoForm({
    defaultValues: {
      name: props.currentListing.name,
      type: props.currentListing.type,
      about: props.currentListing.about,
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormBasicInfoValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const imagesForm = useImagesForm({
    defaultValues: {
      images: props.currentListing.images,
    } satisfies typeof editListingFormImagesValidator.infer as typeof editListingFormImagesValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormImagesValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const videoForm = useVideoForm({
    defaultValues: {
      video: undefined as unknown as File,
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormVideoValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const addressForm = useAddressForm({
    defaultValues: {
      ...props.currentListing.address,
    } as typeof editListingFormAddressValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormAddressValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const contactForm = useContactForm({
    defaultValues: {
      ...props.currentListing.contact,
    } as typeof editListingFormContactValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormContactValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const certificationsForm = useCertificationsForm({
    defaultValues: {
      certifications: props.currentListing.certifications,
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormCertificationsValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const productsForm = useCertificationsForm({
    defaultValues: {
      products: undefined as unknown as string[],
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormProductsValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  return (
    <div className="max-w-4xl w-full self-center flex flex-col gap-10 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Edit Producer Profile</h1>
        <p className="text-muted-foreground">
          Update your producer information and manage your profile settings.
        </p>
      </div>
      <BasicInfoForm form={basicInfoForm} />
      <ImagesForm tier={props.tier} form={imagesForm} />
      <VideoForm tier={props.tier} form={videoForm} />
      <ContactForm form={contactForm} />
      <AddressForm form={addressForm} />
      <CertificationsForm
        tier={props.tier}
        certifications={props.certifications}
        form={certificationsForm}
      />
      <ProductsForm form={productsForm} />
      <SaveButton
        forms={[
          basicInfoForm,
          imagesForm,
          videoForm,
          contactForm,
          addressForm,
          certificationsForm,
        ]}
      />
    </div>
  );
}
