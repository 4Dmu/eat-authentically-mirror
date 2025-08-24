import { Certification } from "@/backend/db/schema";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import {
  EditListingArgs,
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
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  editUserListingOpts,
  loggedInOrganizationListingOptions,
  uploadImagesOpts,
} from "@/utils/listings";
import { toast } from "sonner";
import * as R from "remeda";

export function ProducerEditForm(props: {
  currentListing: Listing;
  tier: SubTier;
  certifications: Certification[];
}) {
  const listingQuery = useQuery(
    loggedInOrganizationListingOptions({ initialData: props.currentListing })
  );

  const editUserListingMutation = useMutation(
    editUserListingOpts({
      onError(err) {
        toast.error(err.message);
      },
      onSuccess() {
        listingQuery.refetch();
        toast.success("Updated listing successfully");
      },
    })
  );

  const uploadImagesMutation = useMutation(uploadImagesOpts());

  const basicInfoForm = useBasicInfoForm({
    defaultValues: {
      name: listingQuery.data?.name as string,
      type: listingQuery.data?.type as "ranch",
      about: listingQuery.data?.about as string,
    } satisfies typeof editListingFormBasicInfoValidator.infer as typeof editListingFormBasicInfoValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormBasicInfoValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const imagesForm = useImagesForm({
    defaultValues: {
      images: listingQuery.data?.images ?? [],
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
      ...listingQuery.data?.address,
    } as typeof editListingFormAddressValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormAddressValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const contactForm = useContactForm({
    defaultValues: {
      ...listingQuery.data?.contact,
    } as typeof editListingFormContactValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormContactValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const certificationsForm = useCertificationsForm({
    defaultValues: {
      certifications: listingQuery.data?.certifications ?? [],
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

  async function handleMultiSubmit() {
    const args: EditListingArgs = { listingId: props.currentListing.id };
    const toReset = [];

    if (imagesForm.state.isValid && imagesForm.state.isDirty) {
      await uploadImagesMutation.mutateAsync(imagesForm.state.values);
      toReset.push(imagesForm);
    }

    if (basicInfoForm.state.isValid && basicInfoForm.state.isDirty) {
      args.basicInfo = basicInfoForm.state.values;
      toReset.push(basicInfoForm);
    }

    if (addressForm.state.isValid && addressForm.state.isDirty) {
      args.address = addressForm.state.values;
      toReset.push(addressForm);
    }

    if (contactForm.state.isValid && contactForm.state.isDirty) {
      args.contact = contactForm.state.values;
      toReset.push(contactForm);
    }

    if (certificationsForm.state.isValid && certificationsForm.state.isDirty) {
      args.certifications = certificationsForm.state.values;
      toReset.push(certificationsForm);
    }

    if (productsForm.state.isValid && productsForm.state.isDirty) {
      args.products = productsForm.state.values;
      toReset.push(productsForm);
    }

    if (R.keys(args).length > 1) {
      await editUserListingMutation.mutateAsync(args);
    }
    toReset.forEach((f) => f.reset());
  }

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
        onSubmit={handleMultiSubmit}
        disableSubmit={
          editUserListingMutation.isPending || uploadImagesMutation.isPending
        }
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
