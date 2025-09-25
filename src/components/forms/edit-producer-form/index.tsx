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
  EditProducerArgs,
  editProducerFormValidator,
  Producer,
} from "@/backend/validators/producers";
import { useAppForm } from "./form";

export function ProducerEditForm(props: {
  producer: Producer;
  tier: SubTier;
  certifications: Certification[];
}) {
  const producerQuery = useLoggedInUserProducer(props.producer.id, {
    initialData: props.producer,
  });

  const editUserListingMutation = useEditUserProducer({
    onError(err) {
      toast.error(err.message);
    },
  });

  const uploadImagesMutation = useUploadImages();
  const uploadVideoMutation = useUploadVideo();
  const deleteVideoMutation = useDeleteVideo();
  const updateExisingImagesMutation = useUpdateExistingImages();

  const form = useAppForm({
    defaultValues: {
      name: producerQuery.data?.name ?? "",
      type: producerQuery.data?.type ?? "ranch",
      about: producerQuery.data?.about ?? null,
      address: producerQuery.data?.address ?? {},
      contact: producerQuery.data?.contact ?? {},
      images: producerQuery.data?.images ?? {
        primaryImgId: null,
        items: [],
      },
      commodities: producerQuery.data?.commodities ?? [],
      certifications: producerQuery.data?.certifications ?? [],
      video: producerQuery.data?.video ?? null,
      socialMedia: producerQuery.data?.socialMedia ?? null,
    } satisfies typeof editProducerFormValidator.infer as typeof editProducerFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerFormValidator),
    },
    onSubmit: (props) => console.log(props),
  });

  const disableSaveButton =
    editUserListingMutation.isPending ||
    uploadImagesMutation.isPending ||
    updateExisingImagesMutation.isPending ||
    uploadVideoMutation.isPending ||
    deleteVideoMutation.isPending;

  async function submit() {
    const args: EditProducerArgs = { producerId: props.producer.id };

    for (const [key, value] of R.entries(form.state.values)) {
      switch (key) {
        case "images":
          if (!R.isDeepEqual(value, producerQuery.data?.images)) {
            const existingImages = form.state.values.images.items.filter(
              (x) => x._type === "cloudflare"
            );
            const toUpload = form.state.values.images.items.filter(
              (x) => x._type === "upload"
            );

            const hasExistingImageChanges =
              !R.isDeepEqual(
                existingImages,
                producerQuery.data?.images.items
              ) ||
              producerQuery.data?.images.primaryImgId !==
                form.state.values.images.primaryImgId;

            const hasImagesToUpload = toUpload.length > 0;

            async function handleImageUpdates() {
              if (hasExistingImageChanges)
                await updateExisingImagesMutation.mutateAsync({
                  producerId: props.producer.id,
                  data: {
                    items: existingImages,
                    primaryImgId: form.state.values.images.primaryImgId,
                  },
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
          break;
        case "video":
          if (value !== producerQuery.data?.video) {
            if (value === null) {
              const deletePromise = deleteVideoMutation.mutateAsync({
                producerId: props.producer.id,
              });
              toast.promise(deletePromise, {
                loading: "Deleting video...",
                success: () => "Video deleted successfully.",
                error: () => `Error deleting video.`,
              });
              await deletePromise;
            } else if (value._type === "upload") {
              const videoUploadPromise = uploadVideoMutation.mutateAsync({
                producerId: props.producer.id,
                toUpload: value,
              });
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
            !R.isDeepEqual(form.state.values[key], producerQuery.data?.[key])
          ) {
            (args[key] as EditProducerArgs[typeof key]) =
              form.state.values[key];
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

    await producerQuery.refetch();
    form.reset();
  }

  return (
    <div className="w-full flex flex-col gap-10">
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
        onSubmit={submit}
        disableSubmit={disableSaveButton}
        disableReset={disableSaveButton}
        form={form}
      />
    </div>
  );
}
