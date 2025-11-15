import type {
  MediaAssetSelect,
  ProducerMediaSelect,
  ProducerWithAll,
} from "@ea/db/schema";
import * as AddressForm from "@ea/forms/address-form";
import * as BasicInfoForm from "@ea/forms/basic-info-form";
import * as CertificationsForm from "@ea/forms/certifications-form";
import * as CommoditiesForm from "@ea/forms/commodities-form";
import * as ContactForm from "@ea/forms/contact-form";
import * as ImagesForm from "@ea/forms/images-form";
import * as VideoForm from "@ea/forms/video-form";
import { Card, CardContent, CardHeader, CardTitle } from "@ea/ui/card";
import { Input } from "@ea/ui/input";
import { Label } from "@ea/ui/label";
import {
  editProducerCertificationsFormValidator,
  editProducerCommoditiesFormValidator,
  editProducerContactFormValditator,
  editProducerFormValidatorV2,
  editProducerLocationFormValidator,
  editProducerMediaFormValidator,
  editProucerVideoFormValidator,
} from "@ea/validators/producers";
import Image from "next/image";
import * as R from "remeda";
import { toast } from "sonner";
import {
  useAddCommodityAndAssociate,
  useDeleteVideo,
  useEditProducerCertifications,
  useEditProducerCommodities,
  useEditProducerContact,
  useEditProducerLocation,
  useEditUserProducer,
  useListCertifications,
  useListCommodoties,
  useProducer,
  useUpdateExistingImages,
  useUploadImages,
  useUploadVideo,
  useUser,
} from "@/client/data";
import { SaveButton } from "./save-button";

function getVideo(media: ProducerWithAll["media"] | undefined) {
  return (media?.find((d) => d.role === "video") ??
    null) as (typeof editProucerVideoFormValidator.infer)["video"];
}

export function ProducerEditForm(props: { producer: ProducerWithAll }) {
  const producerQuery = useProducer(props.producer.id, {
    initialData: props.producer,
  });
  const commodotiesQuery = useListCommodoties();
  const certificationsQuery = useListCertifications();

  const uploadImagesMutation = useUploadImages({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const uploadVideoMutation = useUploadVideo({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const deleteVideoMutation = useDeleteVideo({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const updateExistingImages = useUpdateExistingImages({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const editUserListingMutation = useEditUserProducer({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const editProducerContactMutation = useEditProducerContact({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const editProducerLocationMutation = useEditProducerLocation({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const editProducerCertificationsMutation = useEditProducerCertifications({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const editProducerCommoditiesMutation = useEditProducerCommodities({
    onSuccess: async () => await producerQuery.refetch(),
    onError: (err) => toast.error(err.message),
  });
  const addCommodityAndAssociateMutation = useAddCommodityAndAssociate({
    onSuccess: async () => {
      await producerQuery.refetch();
      await commodotiesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const disableSaveButton =
    editUserListingMutation.isPending ||
    uploadImagesMutation.isPending ||
    updateExistingImages.isPending ||
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
            !ImagesForm.isUpload(x),
        );
        const toUpload = value.media.filter(ImagesForm.isUpload);
        const hasExistingImageChanges = !R.isDeepEqual(
          existingImages,
          producerQuery.data?.media,
        );

        const hasImagesToUpload = toUpload.length > 0;
        async function handleImageUpdates() {
          if (hasExistingImageChanges)
            await updateExistingImages.mutateAsync({
              producerId: props.producer.id,
              data: existingImages,
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
        } else if (VideoForm.isUpload(video)) {
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

  const contactForm = ContactForm.useAppForm({
    defaultValues: {
      email: producerQuery.data?.contact?.email ?? null,
      phone: producerQuery.data?.contact?.phone ?? null,
      websiteUrl: producerQuery.data?.contact?.websiteUrl ?? null,
    } satisfies typeof editProducerContactFormValditator.infer as typeof editProducerContactFormValditator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerContactFormValditator),
    },
    onSubmit: async ({ value }) => {
      const submitPromise = editProducerContactMutation.mutateAsync({
        producerId: props.producer.id,
        ...value,
      });
      toast.promise(submitPromise, {
        loading: "Updating contact data...",
        success: () => "Updated contact data successfully",
        error: () => `Error updating.`,
      });
      await submitPromise;
    },
  });

  const addressForm = AddressForm.useAppForm({
    defaultValues: {
      latitude: producerQuery.data?.location?.latitude ?? null,
      longitude: producerQuery.data?.location?.longitude ?? null,
      locality: producerQuery.data?.location?.locality ?? null,
      city: producerQuery.data?.location?.city ?? null,
      postcode: producerQuery.data?.location?.postcode ?? null,
      adminArea: producerQuery.data?.location?.adminArea ?? null,
      country: producerQuery.data?.location?.country ?? null,
    } as typeof editProducerLocationFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerLocationFormValidator),
    },
    onSubmit: async ({ value }) => {
      const submitPromise = editProducerLocationMutation.mutateAsync({
        producerId: props.producer.id,
        ...value,
      });
      toast.promise(submitPromise, {
        loading: "Updating location data...",
        success: () => "Updated location data successfully",
        error: () => `Error updating.`,
      });
      await submitPromise;
    },
  });

  const certificationsForm = CertificationsForm.useAppForm({
    defaultValues: {
      certifications: producerQuery.data?.certifications ?? [],
    } satisfies typeof editProducerCertificationsFormValidator.infer as typeof editProducerCertificationsFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerCertificationsFormValidator),
    },
    onSubmit: async ({ value }) => {
      const submitPromise = editProducerCertificationsMutation.mutateAsync({
        producerId: props.producer.id,
        certifications: value.certifications.map(
          (cert) => cert.certificationId,
        ),
      });
      toast.promise(submitPromise, {
        loading: "Updating producer certifications...",
        success: () => "Updated producer certifications",
        error: () => `Error updating.`,
      });
      await submitPromise;
    },
  });

  const commoditiesForm = CommoditiesForm.useAppForm({
    defaultValues: {
      commodities: producerQuery.data?.commodities ?? [],
    } satisfies typeof editProducerCommoditiesFormValidator.infer as typeof editProducerCommoditiesFormValidator.infer,
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(editProducerCommoditiesFormValidator),
    },
    onSubmit: async ({ value }) => {
      const existing = value.commodities.filter((r) => "commodityId" in r);
      const newComms = value.commodities.filter((r) => "name" in r);

      const promises = [];

      promises.push(
        editProducerCommoditiesMutation.mutateAsync({
          producerId: props.producer.id,
          commodities: existing.map((comm) => comm.commodityId),
        }),
      );

      for (const comm of newComms) {
        promises.push(
          addCommodityAndAssociateMutation.mutateAsync({
            producerId: props.producer.id,
            name: comm.name,
          }),
        );
      }

      const submitPromise = Promise.all(promises);

      toast.promise(submitPromise, {
        loading: "Updating producer commodities...",
        success: () => "Updated producer commodities",
        error: () => `Error updating.`,
      });

      await submitPromise;
    },
  });

  const commodoties = useListCommodoties();
  const user = useUser(props.producer.userId);

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Edit Producer Info</h1>
        <p className="text-muted-foreground">
          Edit this producers info{" "}
          <span className="text-destructive">
            (Warning this will affect production and potentially customer data)
          </span>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Producer Owner</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {user.data?.has_image === true && (
            <div>
              <Image
                className="rounded-full size-20"
                src={user.data.image_url}
                alt="profile"
                width={120}
                height={120}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>User Id</Label>
            <Input readOnly defaultValue={producerQuery.data?.userId ?? ""} />
          </div>
          <div className="flex gap-5">
            <div className="flex flex-col gap-2">
              <Label>Firstname</Label>
              <Input readOnly value={user.data?.first_name ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Lastname</Label>
              <Input readOnly value={user.data?.last_name ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Subsctiption Rank</Label>
            <Input
              readOnly
              defaultValue={producerQuery.data?.subscriptionRank ?? ""}
            />
          </div>
        </CardContent>
      </Card>
      <BasicInfoForm.Form form={basicInfoForm} />
      <ImagesForm.Form tier={"Admin"} maxFiles={10} form={imagesForm} />
      <VideoForm.Form canUploadVideo={true} form={videoForm} />
      <ContactForm.Form form={contactForm} />
      <AddressForm.Form form={addressForm} />
      <CertificationsForm.Form
        maxCerts={10}
        certifications={certificationsQuery.data ?? []}
        producerId={props.producer.id}
        form={certificationsForm}
      />
      <CommoditiesForm.Form
        commodities={commodoties.data}
        form={commoditiesForm}
      />
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
