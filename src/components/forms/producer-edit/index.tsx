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
  deleteVideoOpts,
  editUserListingOpts,
  loggedInOrganizationListingOptions,
  updateExistingImagesOpts,
  uploadImagesOpts,
  uploadVideoOpts,
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
    })
  );

  const uploadImagesMutation = useMutation(uploadImagesOpts());
  const uploadVideoMutation = useMutation(uploadVideoOpts());
  const deleteVideoMutation = useMutation(deleteVideoOpts());
  const updateExisingImagesMutation = useMutation(updateExistingImagesOpts());

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
      images: listingQuery.data?.images ?? { items: [], primaryImgId: null },
    } satisfies typeof editListingFormImagesValidator.infer as typeof editListingFormImagesValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormImagesValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const videoForm = useVideoForm({
    defaultValues: {
      video: listingQuery.data?.video,
    } as typeof editListingFormVideoValidator.infer,
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
      commodities: listingQuery.data?.commodities ?? [],
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
      const existingImages = imagesForm.state.values.images.items.filter(
        (x) => x._type === "cloudflare"
      );
      const toUpload = imagesForm.state.values.images.items.filter(
        (x) => x._type === "upload"
      );

      if (toUpload.length > 0) {
        const uploadPromise = uploadImagesMutation.mutateAsync(toUpload);
        toast.promise(uploadPromise, {
          loading: "Uploading images...",
          success: () => "Images uploaded successfully.",
          error: () => `Error uploading images.`,
        });
        await uploadPromise;
      }

      if (
        JSON.stringify(existingImages) !==
        JSON.stringify(listingQuery.data?.images ?? props.currentListing.images)
      ) {
        console.log("changed");
        const updateExisingImagesPromise =
          updateExisingImagesMutation.mutateAsync({
            items: existingImages,
            primaryImgId: imagesForm.state.values.images.primaryImgId,
          });
        toast.promise(updateExisingImagesPromise, {
          loading: "Updating images...",
          success: () => "Images updated successfully.",
          error: () => `Error updating images.`,
        });
        await updateExisingImagesPromise;
      } else {
        console.log("not changed");
      }

      toReset.push(imagesForm);
    }

    if (videoForm.state.isValid && videoForm.state.isDirty) {
      if (videoForm.state.values.video === null) {
        const deletePromise = deleteVideoMutation.mutateAsync();
        toast.promise(deletePromise, {
          loading: "Deleting video...",
          success: () => "Video deleted successfully.",
          error: () => `Error deleting video.`,
        });
        await deletePromise;
      } else if (videoForm.state.values.video._type === "upload") {
        const videoUploadPromise = uploadVideoMutation.mutateAsync(
          videoForm.state.values.video
        );
        toast.promise(videoUploadPromise, {
          loading: "Uploading video...",
          success: () => "Video uploaded successfully.",
          error: () => `Error uploading video.`,
        });
        await videoUploadPromise;
      }
      toReset.push(videoForm);
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
      args.commodities = productsForm.state.values;
      toReset.push(productsForm);
    }

    if (R.keys(args).length > 1) {
      const submitPromise = editUserListingMutation.mutateAsync(args);
      toast.promise(submitPromise, {
        loading: "Submiting data...",
        success: () => "Updated successfully",
        error: () => `Error updating.`,
      });
      await submitPromise;
    }
    await listingQuery.refetch();
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
          editUserListingMutation.isPending ||
          uploadImagesMutation.isPending ||
          uploadVideoMutation.isPending ||
          deleteVideoMutation.isPending
        }
        forms={[
          basicInfoForm,
          imagesForm,
          videoForm,
          contactForm,
          addressForm,
          certificationsForm,
          productsForm,
        ]}
      />
    </div>
  );
}
