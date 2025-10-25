import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useId } from "react";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { FileImage } from "@/components/file-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStore } from "@tanstack/react-form";
import { FieldInfo } from "../../../helpers/field-info";
import Image from "next/image";
import {
  SelectFileButton,
  TemporyFilesSelectButton,
} from "@/components/select-file-button";
import { GripIcon, RotateCwIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { defaultOptions, withForm } from "./context";
import { editProducerMediaFormValidator } from "@/backend/validators/producers";
import { ProducerWithMap } from "@/backend/db/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";

export function isUpload(
  value: (typeof editProducerMediaFormValidator.infer)["media"][number]
): value is Extract<
  (typeof editProducerMediaFormValidator.infer)["media"][number],
  { file: File; position: number; id: string }
> {
  if ("file" in value) {
    return true;
  }
  return false;
}

export const Form = withForm({
  ...defaultOptions,
  props: {
    tier: "Free" as SubTier,
  },
  render: function Render({ form, tier }) {
    const media = useStore(form.store, (state) => state.values.media);

    const maxFiles =
      tier === "Free"
        ? 1
        : tier.tier === "community"
          ? 1
          : tier.tier === "pro"
            ? 4
            : tier.tier === "premium" || tier.tier === "enterprise"
              ? 5
              : 1;

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Images ( {media.length ?? 0}/{maxFiles})
          </CardTitle>
          <CardDescription>
            <span className="capitalize">
              {tier === "Free" ? "Free" : tier.tier} Plan:{" "}
              {tier === "Free"
                ? 1
                : tier.tier === "community"
                  ? 1
                  : tier.tier === "pro"
                    ? 4
                    : tier.tier === "premium" || tier.tier === "enterprise"
                      ? 5
                      : 1}{" "}
              Image
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form.Field name="media">
            {(field) => (
              <div className="flex flex-col gap-3">
                <Label>Add Images</Label>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 w-full">
                  <DragDropProvider
                    onDragOver={(event) => {
                      const { target, source } = event.operation;
                      if (!target || !source) return;

                      const targetId = target.id.toString();
                      const sourceId = source.id.toString();

                      console.log(targetId, sourceId);

                      const targetValueIndex = field.state.value.findIndex(
                        (v) =>
                          isUpload(v)
                            ? v.id === targetId
                            : v.assetId === targetId
                      );
                      const targetValue = field.state.value[targetValueIndex];
                      const sourceValueIndex = field.state.value.findIndex(
                        (v) =>
                          isUpload(v)
                            ? v.id === sourceId
                            : v.assetId === sourceId
                      );
                      const sourceValue = field.state.value[sourceValueIndex];

                      console.log(targetValue, sourceValue);

                      if (!targetValue || !sourceValue) {
                        return;
                      }

                      const position = sourceValue.position;
                      sourceValue.position = targetValue.position;
                      targetValue.position = position;

                      field.replaceValue(targetValueIndex, { ...targetValue });
                      field.replaceValue(sourceValueIndex, { ...sourceValue });
                    }}
                  >
                    {field.state.value.map((value, i) => (
                      <SortableImage
                        key={i}
                        form={form}
                        value={value}
                        index={i}
                      />
                    ))}
                  </DragDropProvider>
                </div>
                <form.Field name="media" mode="array">
                  {(subField) => (
                    <TemporyFilesSelectButton
                      maxFiles={maxFiles - (field.state.value?.length ?? 0)}
                      mimeType="image/*"
                      onSelectMoreFilesThanAllowed={() => {
                        toast.error(
                          `Upgrade to select more than ${maxFiles} files.`
                        );
                      }}
                      onSelect={(files) => {
                        files.forEach((file, i) =>
                          subField.pushValue({
                            file: file,
                            position: i + subField.state.value.length,
                            id: crypto.randomUUID(),
                          })
                        );
                      }}
                    >
                      Add Images
                    </TemporyFilesSelectButton>
                  )}
                </form.Field>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    );
  },
});

const SortableImage = withForm({
  ...defaultOptions,
  props: {
    value: undefined as unknown as
      | ProducerWithMap["media"][number]
      | {
          file: File;
          position: number;
          id: string;
        },
    index: 0,
  },
  render: ({ form, value, index }) => {
    const { ref, handleRef } = useSortable({
      id: `${isUpload(value) ? value.id : value.assetId}`,
      index: index,
    });

    return (
      <div ref={ref} className="flex flex-col gap-1 relative">
        <div className="p-2 flex gap-2 justify-end w-full absolute top-2 right-2">
          <form.Field name="media" mode="array">
            {(mediaField) => (
              <>
                {!isUpload(value) && (
                  <Checkbox
                    onCheckedChange={(v) => {
                      if (v) {
                        const currentRoleIndex =
                          mediaField.state.value.findIndex(
                            (v) => !isUpload(v) && v.role === "cover"
                          );
                        const currentRole =
                          mediaField.state.value[currentRoleIndex];
                        if (currentRole) {
                          mediaField.replaceValue(currentRoleIndex, {
                            ...currentRole,
                            role: "gallery",
                          });
                        }
                        mediaField.replaceValue(index, {
                          ...value,
                          role: "cover",
                        });
                      }
                    }}
                    checked={value.role === "cover"}
                    className="size-9"
                  />
                )}
              </>
            )}
          </form.Field>
          {isUpload(value) && (
            <form.Field name={`media[${index}].file`}>
              {(subField) => (
                <SelectFileButton
                  maxFileSize={200000000}
                  size={"icon"}
                  variant={"default"}
                  mimeType="image/*"
                  file={subField.state.value}
                  onChange={(f) => subField.handleChange(f as File)}
                >
                  <RotateCwIcon />
                </SelectFileButton>
              )}
            </form.Field>
          )}
          <form.Field name="media" mode="array">
            {(subField) => (
              <Button
                onClick={() => {
                  subField.removeValue(index);
                  for (let i = index; i < subField.state.value.length; i++) {
                    const value = subField.state.value[i];
                    if (!value) continue;
                    subField.replaceValue(i, {
                      ...value,
                      position: value.position - 1,
                    });
                  }
                }}
                size={"icon"}
                variant={"destructive"}
              >
                <XIcon />
              </Button>
            )}
          </form.Field>
          <Button ref={handleRef} size={"icon"} variant={"default"}>
            <GripIcon />
          </Button>
        </div>
        <div className="w-full h-[200px] rounded overflow-hidden border">
          {isUpload(value) ? (
            value.file && (
              <FileImage
                className="object-cover h-full w-full"
                file={value.file}
              />
            )
          ) : (
            <Image
              src={value.asset.url}
              alt={value.caption ?? ""}
              className="object-cover h-full w-full"
              width={200}
              height={200}
            />
          )}
        </div>
      </div>
    );
  },
});
