import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import * as BasicInfoForm from "./sub-forms/basic-info-form";
import * as ImagesForm from "./sub-forms/images-form";
import * as VideoForm from "./sub-forms/video-form";
import * as ContactForm from "./sub-forms/contact-form";
import * as CertificationsForm from "./sub-forms/certifications-form";
import * as CommoditiesForm from "./sub-forms/commodities-form";
import * as AddressForm from "./sub-forms/address-form";
import { SaveButton } from "./save-button";
import {
  useDeleteVideo,
  useEditUserProducer,
  useLoggedInUserProducer,
  useUpdateExistingImages,
  useUploadImages,
  useUploadVideo,
} from "@/utils/producers";
import { toast } from "sonner";
import * as R from "remeda";
import {
  EditProducerArgsV2,
  editProducerCertificationsFormValidator,
  editProducerCommoditiesFormValidator,
  editProducerContactFormValditator,
  editProducerFormValidatorV2,
  editProducerLocationArgsValidator,
  editProducerMediaFormValidator,
  editProucerVideoFormValidator,
} from "@/backend/validators/producers";
import {
  CertificationSelect,
  MediaAssetSelect,
  ProducerMediaSelect,
  ProducerWithAll,
} from "@/backend/db/schema";

function getVideo(media: ProducerWithAll["media"] | undefined) {
  return (media?.find((d) => d.role === "video") ??
    null) as (typeof editProucerVideoFormValidator.infer)["video"];
}

export function ProducerEditForm(props: {
  producer: ProducerWithAll;
  tier: SubTier;
  certifications: CertificationSelect[];
}) {
  const producerQuery = useLoggedInUserProducer(props.producer.id, {
    initialData: props.producer,
  });

  const uploadImagesMutation = useUploadImages();
  const uploadVideoMutation = useUploadVideo();
  const deleteVideoMutation = useDeleteVideo();
  const updateExisingImagesMutation = useUpdateExistingImages();
  const editUserListingMutation = useEditUserProducer({
    onError(err) {
      toast.error(err.message);
    },
  });

  const disableSaveButton =
    editUserListingMutation.isPending ||
    uploadImagesMutation.isPending ||
    updateExisingImagesMutation.isPending ||
    uploadVideoMutation.isPending ||
    deleteVideoMutation.isPending;

  const basicInfoForm = BasicInfoForm.useAppForm({
    defaultValues: {
      name: producerQuery.data?.name ?? "",
      type: producerQuery.data?.type ?? "ranch",
      about: producerQuery.data?.about ?? null,
      summary: producerQuery.data?.summary,
    } satisfies typeof editProducerFormValidatorV2.infer as typeof editProducerFormValidatorV2.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerFormValidatorV2),
    },
    onSubmit: async ({ value }) => {
      const submitPromise = editUserListingMutation.mutateAsync({
        id: props.producer.id,
        ...value,
      });
      toast.promise(submitPromise, {
        loading: "Submiting data...",
        success: () => "Updated successfully",
        error: () => `Error updating.`,
      });
      await submitPromise;
    },
  });

  const imagesForm = ImagesForm.useAppForm({
    defaultValues: {
      media: producerQuery.data?.media ?? [],
    } satisfies typeof editProducerMediaFormValidator.infer as typeof editProducerMediaFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerMediaFormValidator),
    },
    onSubmit: async ({ value }) => {
      if (!R.isDeepEqual(value, producerQuery.data)) {
        const existingImages = value.media.filter(
          (x): x is ProducerMediaSelect & { asset: MediaAssetSelect } =>
            !ImagesForm.isUpload(x)
        );
        const toUpload = value.media.filter(ImagesForm.isUpload);
        const hasExistingImageChanges = !R.isDeepEqual(
          existingImages,
          producerQuery.data?.media
        );

        const hasImagesToUpload = toUpload.length > 0;
        async function handleImageUpdates() {
          if (hasExistingImageChanges)
            await updateExisingImagesMutation.mutateAsync({
              producerId: props.producer.id,
              data: existingImages.map((i) => i.assetId),
            });
          if (hasImagesToUpload)
            await uploadImagesMutation.mutateAsync({
              producerId: props.producer.id,
              toUpload,
            });
        }
        if (hasExistingImageChanges || hasImagesToUpload) {
          const promise = handleImageUpdates();
          toast.promise(promise, {
            loading: hasImagesToUpload
              ? "Uploading images..."
              : "Updating images...",
            success: hasImagesToUpload
              ? "Uploaded images successfully"
              : "Updating images successfully",
            error: hasImagesToUpload
              ? "Error uploaded images"
              : "Error updating images",
          });
          await promise;
        }
      }
    },
  });

  const videoForm = VideoForm.useAppForm({
    defaultValues: {
      video: getVideo(producerQuery.data?.media),
    } satisfies typeof editProucerVideoFormValidator.infer as typeof editProucerVideoFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProucerVideoFormValidator),
    },
    onSubmit: async ({ value: { video } }) => {
      const currentVideo = getVideo(producerQuery.data?.media);
      if (video !== currentVideo) {
        if (video === null) {
          const deletePromise = deleteVideoMutation.mutateAsync({
            producerId: props.producer.id,
          });
          toast.promise(deletePromise, {
            loading: "Deleting video...",
            success: () => "Video deleted successfully.",
            error: () => `Error deleting video.`,
          });
          await deletePromise;
        } else if (ImagesForm.isUpload(video)) {
          const videoUploadPromise = uploadVideoMutation.mutateAsync({
            producerId: props.producer.id,
            toUpload: video,
          });
          toast.promise(videoUploadPromise, {
            loading: "Uploading video...",
            success: () => "Video uploaded successfully.",
            error: () => `Error uploading video.`,
          });
          await videoUploadPromise;
        }
      }
    },
  });

  // @TODO
  const contactForm = ContactForm.useAppForm({
    defaultValues: {
      email: producerQuery.data?.contact?.email,
      phone: producerQuery.data?.contact?.phone,
      websiteUrl: producerQuery.data?.contact?.websiteUrl,
    } satisfies typeof editProducerContactFormValditator.infer as typeof editProducerContactFormValditator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerContactFormValditator),
    },
  });

  // @TODO
  const addressForm = AddressForm.useAppForm({
    defaultValues: {
      latitude: null,
      longitude: null,
      locality: null,
      city: null,
      postcode: null,
      adminArea: null,
      country: null,
      geohash: null,
    } as typeof editProducerLocationArgsValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerLocationArgsValidator),
    },
  });

  // @TODO
  const certificationsForm = CertificationsForm.useAppForm({
    defaultValues: {
      certifications: producerQuery.data?.certifications ?? [],
    } satisfies typeof editProducerCertificationsFormValidator.infer as typeof editProducerCertificationsFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerCertificationsFormValidator),
    },
  });

  // @TODO
  const commoditiesForm = CommoditiesForm.useAppForm({
    defaultValues: {
      commodities: producerQuery.data?.commodities ?? [],
    } satisfies typeof editProducerCommoditiesFormValidator.infer as typeof editProducerCommoditiesFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerCommoditiesFormValidator),
    },
  });

  async function submit() {
    const args: EditProducerArgsV2 = { id: props.producer.id };

    // for (const [key, value] of R.entries(form.state.values)) {
    //   switch (key) {
    //     case "images":
    //       if (!R.isDeepEqual(value, producerQuery.data?.images)) {
    //         const existingImages = form.state.values.images.items.filter(
    //           (x) => x._type === "cloudflare"
    //         );
    //         const toUpload = form.state.values.images.items.filter(
    //           (x) => x._type === "upload"
    //         );

    //         const hasExistingImageChanges =
    //           !R.isDeepEqual(
    //             existingImages,
    //             producerQuery.data?.images.items
    //           ) ||
    //           producerQuery.data?.images.primaryImgId !==
    //             form.state.values.images.primaryImgId;

    //         const hasImagesToUpload = toUpload.length > 0;

    //         async function handleImageUpdates() {
    //           if (hasExistingImageChanges)
    //             await updateExisingImagesMutation.mutateAsync({
    //               producerId: props.producer.id,
    //               data: {
    //                 items: existingImages,
    //                 primaryImgId: form.state.values.images.primaryImgId,
    //               },
    //             });

    //           if (hasImagesToUpload)
    //             await uploadImagesMutation.mutateAsync({
    //               producerId: props.producer.id,
    //               toUpload,
    //             });
    //         }

    //         if (hasExistingImageChanges || hasImagesToUpload) {
    //           const promise = handleImageUpdates();
    //           toast.promise(promise, {
    //             loading: hasImagesToUpload
    //               ? "Uploading images..."
    //               : "Updating images...",
    //             success: hasImagesToUpload
    //               ? "Uploaded images successfully"
    //               : "Updating images successfully",
    //             error: hasImagesToUpload
    //               ? "Error uploaded images"
    //               : "Error updating images",
    //           });
    //           await promise;
    //         }
    //       }
    //       break;
    //     case "video":
    //       if (value !== producerQuery.data?.video) {
    //         if (value === null) {
    //           const deletePromise = deleteVideoMutation.mutateAsync({
    //             producerId: props.producer.id,
    //           });
    //           toast.promise(deletePromise, {
    //             loading: "Deleting video...",
    //             success: () => "Video deleted successfully.",
    //             error: () => `Error deleting video.`,
    //           });
    //           await deletePromise;
    //         } else if (value._type === "upload") {
    //           const videoUploadPromise = uploadVideoMutation.mutateAsync({
    //             producerId: props.producer.id,
    //             toUpload: value,
    //           });
    //           toast.promise(videoUploadPromise, {
    //             loading: "Uploading video...",
    //             success: () => "Video uploaded successfully.",
    //             error: () => `Error uploading video.`,
    //           });
    //           await videoUploadPromise;
    //         }
    //       }
    //       break;
    //     default:
    //       if (
    //         !R.isDeepEqual(form.state.values[key], producerQuery.data?.[key])
    //       ) {
    //         (args[key] as EditProducerArgs[typeof key]) =
    //           form.state.values[key];
    //       }
    //       break;
    //   }
    // }

    if (R.keys(args).length > 1) {
      const submitPromise = editUserListingMutation.mutateAsync(args);
      toast.promise(submitPromise, {
        loading: "Submiting data...",
        success: () => "Updated successfully",
        error: () => `Error updating.`,
      });
      await submitPromise;
    }

    await producerQuery.refetch();
    basicInfoForm.reset();
  }

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Edit Producer Profile</h1>
        <p className="text-muted-foreground">
          Update your producer information and manage your profile settings.
        </p>
      </div>
      <BasicInfoForm.Form form={basicInfoForm} />
      <ImagesForm.Form tier={props.tier} form={imagesForm} />
      <VideoForm.Form tier={props.tier} form={videoForm} />
      <ContactForm.Form form={contactForm} />
      <AddressForm.Form form={addressForm} />
      <CertificationsForm.Form
        tier={props.tier}
        certifications={props.certifications}
        producerId={props.producer.id}
        form={certificationsForm}
      />
      <CommoditiesForm.Form form={commoditiesForm} />
      <SaveButton
        disableSubmit={disableSaveButton}
        disableReset={disableSaveButton}
        forms={[
          basicInfoForm,
          imagesForm,
          contactForm,
          addressForm,
          certificationsForm,
          commoditiesForm,
        ]}
      />
    </div>
  );
}
