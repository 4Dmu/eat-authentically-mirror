import { Certification } from "@/backend/db/schema";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { BasicInfoForm } from "./sub-forms/basic-info-form";
import { ImagesForm } from "./sub-forms/images-form";
import { VideoForm } from "./sub-forms/video-form";
import { ContactForm } from "./sub-forms/contact-form";
import { CertificationsForm } from "./sub-forms/certifications-form";
import { ProductsForm } from "./sub-forms/products-form";
import { AddressForm } from "./sub-forms/address-form";
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
import {
  EditListingArgs,
  editListingFormValidator,
  Listing,
} from "@/backend/validators/listings";
import { useAppForm } from "./form";

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

  const form = useAppForm({
    defaultValues: {
      name: listingQuery.data?.name ?? "",
      type: listingQuery.data?.type ?? "ranch",
      about: listingQuery.data?.about ?? null,
      address: listingQuery.data?.address ?? {},
      contact: listingQuery.data?.contact ?? {},
      images: listingQuery.data?.images ?? {
        primaryImgId: null,
        items: [],
      },
      commodities: listingQuery.data?.commodities ?? [],
      certifications: listingQuery.data?.certifications ?? [],
      video: listingQuery.data?.video ?? null,
      socialMedia: listingQuery.data?.socialMedia ?? null,
    } satisfies typeof editListingFormValidator.infer as typeof editListingFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editListingFormValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  async function handleMultiSubmit() {
    const args: EditListingArgs = { listingId: props.currentListing.id };

    // if (!R.isDeepEqual(form.state.values.images, listingQuery.data?.images)) {
    //   console.log(" images");
    //   const existingImages = form.state.values.images.items.filter(
    //     (x) => x._type === "cloudflare"
    //   );
    //   const toUpload = form.state.values.images.items.filter(
    //     (x) => x._type === "upload"
    //   );

    //   const promises: Promise<unknown>[] = [];

    //   if (
    //     JSON.stringify(existingImages) !==
    //       JSON.stringify(listingQuery.data?.images.items) ||
    //     listingQuery.data?.images.primaryImgId !==
    //       form.state.values.images.primaryImgId
    //   ) {
    //     console.log("changed");
    //     const updateExisingImagesPromise =
    //       updateExisingImagesMutation.mutateAsync({
    //         items: existingImages,
    //         primaryImgId: form.state.values.images.primaryImgId,
    //       });
    //     toast.promise(updateExisingImagesPromise, {
    //       loading: "Updating images...",
    //       success: () => "Images updated successfully.",
    //       error: () => `Error updating images.`,
    //     });
    //     promises.push(updateExisingImagesPromise);
    //     await updateExisingImagesPromise;
    //   } else {
    //     console.log("not changed");
    //   }

    //   if (toUpload.length > 0) {
    //     const uploadPromise = uploadImagesMutation.mutateAsync(toUpload);
    //     toast.promise(uploadPromise, {
    //       loading: "Uploading images...",
    //       success: () => "Images uploaded successfully.",
    //       error: () => `Error uploading images.`,
    //     });
    //     await uploadPromise;
    //   }
    // }

    // if (form.state.values.video !== listingQuery.data?.video) {
    //   if (form.state.values.video === null) {
    //     const deletePromise = deleteVideoMutation.mutateAsync();
    //     toast.promise(deletePromise, {
    //       loading: "Deleting video...",
    //       success: () => "Video deleted successfully.",
    //       error: () => `Error deleting video.`,
    //     });
    //     await deletePromise;
    //   } else if (form.state.values.video._type === "upload") {
    //     const videoUploadPromise = uploadVideoMutation.mutateAsync(
    //       form.state.values.video
    //     );
    //     toast.promise(videoUploadPromise, {
    //       loading: "Uploading video...",
    //       success: () => "Video uploaded successfully.",
    //       error: () => `Error uploading video.`,
    //     });
    //     await videoUploadPromise;
    //   }
    // }

    // if (form.state.values.name !== listingQuery.data?.name) {
    //   args.name = form.state.values.name;
    // }

    // if (form.state.values.type !== listingQuery.data?.type) {
    //   args.type = form.state.values.type;
    // }

    // if (form.state.values.about !== listingQuery.data?.about) {
    //   args.about = form.state.values.about;
    // }

    // if (form.state.values.address !== listingQuery.data?.address) {
    //   args.address = form.state.values.address;
    // }

    // if (form.state.values.contact !== listingQuery.data?.contact) {
    //   args.contact = form.state.values.contact;
    // }

    // if (
    //   JSON.stringify(form.state.values.certifications) !==
    //   JSON.stringify(listingQuery.data?.certifications)
    // ) {
    //   args.certifications = form.state.values.certifications;
    // }

    // if (
    //   JSON.stringify(form.state.values.commodities) !==
    //   JSON.stringify(listingQuery.data?.commodities)
    // ) {
    //   args.commodities = form.state.values.commodities;
    // }

    for (const [key, value] of R.entries(form.state.values)) {
      switch (key) {
        case "images":
          if (!R.isDeepEqual(value, listingQuery.data?.images)) {
            console.log(" images");
            const existingImages = form.state.values.images.items.filter(
              (x) => x._type === "cloudflare"
            );
            const toUpload = form.state.values.images.items.filter(
              (x) => x._type === "upload"
            );

            const promises: Promise<unknown>[] = [];

            if (
              JSON.stringify(existingImages) !==
                JSON.stringify(listingQuery.data?.images.items) ||
              listingQuery.data?.images.primaryImgId !==
                form.state.values.images.primaryImgId
            ) {
              console.log("changed");
              const updateExisingImagesPromise =
                updateExisingImagesMutation.mutateAsync({
                  items: existingImages,
                  primaryImgId: form.state.values.images.primaryImgId,
                });
              toast.promise(updateExisingImagesPromise, {
                loading: "Updating images...",
                success: () => "Images updated successfully.",
                error: () => `Error updating images.`,
              });
              promises.push(updateExisingImagesPromise);
              await updateExisingImagesPromise;
            } else {
              console.log("not changed");
            }

            if (toUpload.length > 0) {
              const uploadPromise = uploadImagesMutation.mutateAsync(toUpload);
              toast.promise(uploadPromise, {
                loading: "Uploading images...",
                success: () => "Images uploaded successfully.",
                error: () => `Error uploading images.`,
              });
              await uploadPromise;
            }
          }
          break;
        case "video":
          if (value !== listingQuery.data?.video) {
            if (value === null) {
              const deletePromise = deleteVideoMutation.mutateAsync();
              toast.promise(deletePromise, {
                loading: "Deleting video...",
                success: () => "Video deleted successfully.",
                error: () => `Error deleting video.`,
              });
              await deletePromise;
            } else if (value._type === "upload") {
              const videoUploadPromise = uploadVideoMutation.mutateAsync(value);
              toast.promise(videoUploadPromise, {
                loading: "Uploading video...",
                success: () => "Video uploaded successfully.",
                error: () => `Error uploading video.`,
              });
              await videoUploadPromise;
            }
          }
          break;
        default:
          if (
            !R.isDeepEqual(form.state.values[key], listingQuery.data?.[key])
          ) {
            args[key] = form.state.values[key] as any;
          }
          break;
      }
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
    form.reset();
  }

  return (
    <div className="max-w-4xl w-full self-center flex flex-col gap-10 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Edit Producer Profile</h1>
        <p className="text-muted-foreground">
          Update your producer information and manage your profile settings.
        </p>
      </div>
      <BasicInfoForm form={form} />
      <ImagesForm tier={props.tier} form={form} />
      <VideoForm tier={props.tier} form={form} />
      <ContactForm form={form} />
      <AddressForm form={form} />
      <CertificationsForm
        tier={props.tier}
        certifications={props.certifications}
        form={form}
      />
      <ProductsForm form={form} />
      <SaveButton
        onSubmit={handleMultiSubmit}
        disableSubmit={
          editUserListingMutation.isPending ||
          uploadImagesMutation.isPending ||
          uploadVideoMutation.isPending ||
          deleteVideoMutation.isPending
        }
        form={form}
      />
    </div>
  );
}
