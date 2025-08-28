import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { FileImage } from "@/components/file-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStore } from "@tanstack/react-form";
import { FieldInfo } from "../../helpers/field-info";
import Image from "next/image";
import {
  SelectFileButton,
  TemporyFilesSelectButton,
} from "@/components/select-file-button";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, RotateCwIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { emptyOptions, withForm } from "../form";

export const ImagesForm = withForm({
  ...emptyOptions,
  props: {
    tier: "Free" as SubTier,
  },
  render: function Render({ form, tier }) {
    const images = useStore(form.store, (state) => state.values.images);

    const maxFiles =
      tier === "Free"
        ? 1
        : tier.tier === "community"
        ? 1
        : tier.tier === "pro"
        ? 4
        : tier.tier === "premium"
        ? 5
        : 1;

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Images ( {images?.items.length ?? 0}/{maxFiles})
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
                : tier.tier === "premium"
                ? 5
                : 1}{" "}
              Image
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form.Field name="images">
            {(field) => (
              <div className="flex flex-col gap-3">
                <Label>Add Images</Label>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 w-full">
                  {field.state.value?.items.map((value, i) => (
                    <div className="flex flex-col gap-1 relative" key={i}>
                      <div className="p-2 flex gap-2 justify-end w-full absolute top-2 right-2">
                        <form.Field name={`images.items[${i}]`}>
                          {(subField) => (
                            <CheckboxPrimitive.Root
                              checked={
                                (subField.state.value._type === "upload" &&
                                  subField.state.value.isPrimary) ||
                                (subField.state.value._type == "cloudflare" &&
                                  field.state.value.primaryImgId ===
                                    subField.state.value.cloudflareId)
                              }
                              onCheckedChange={(r) => {
                                if (r === true && field.state.value) {
                                  const newValue = field.state.value.items.map(
                                    (f) =>
                                      f._type == "cloudflare"
                                        ? { ...f }
                                        : { ...f, isPrimary: false }
                                  );

                                  const item = newValue[i];

                                  if (item._type === "upload") {
                                    item.isPrimary = true;
                                    newValue[i] = item;
                                  }

                                  field.handleChange({
                                    items: [...newValue],
                                    primaryImgId:
                                      item._type === "cloudflare"
                                        ? item.cloudflareId
                                        : null,
                                  });
                                } else if (r === false && field.state.value) {
                                  const newValue = field.state.value.items.map(
                                    (f) =>
                                      f._type == "cloudflare"
                                        ? { ...f }
                                        : { ...f, isPrimary: false }
                                  );

                                  field.handleChange({
                                    items: [...newValue],
                                    primaryImgId: null,
                                  });
                                }
                              }}
                              data-slot="checkbox"
                              className={
                                "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-9 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                              }
                            >
                              <CheckboxPrimitive.Indicator
                                data-slot="checkbox-indicator"
                                className="flex items-center justify-center text-current transition-none"
                              >
                                <CheckIcon className="size-3.5" />
                              </CheckboxPrimitive.Indicator>
                            </CheckboxPrimitive.Root>
                          )}
                        </form.Field>
                        {value._type === "upload" && (
                          <form.Field name={`images.items[${i}].file`}>
                            {(subField) => (
                              <SelectFileButton
                                maxFileSize={200000000}
                                size={"icon"}
                                variant={"default"}
                                mimeType="image/*"
                                file={subField.state.value}
                                onChange={(f) =>
                                  subField.handleChange(f as File)
                                }
                              >
                                <RotateCwIcon />
                              </SelectFileButton>
                            )}
                          </form.Field>
                        )}
                        <form.Field name="images.items" mode="array">
                          {(subField) => (
                            <Button
                              onClick={() => {
                                if (field.state.value.items.length == 1) {
                                  field.handleChange({
                                    items: [],
                                    primaryImgId: null,
                                  });
                                } else {
                                  subField.removeValue(i);
                                }
                              }}
                              size={"icon"}
                              variant={"destructive"}
                            >
                              <XIcon />
                            </Button>
                          )}
                        </form.Field>
                      </div>
                      <div className="w-full h-[200px] rounded overflow-hidden border">
                        {value._type === "upload" ? (
                          value.file && (
                            <FileImage
                              className="object-cover h-full w-full"
                              file={value.file}
                            />
                          )
                        ) : (
                          <Image
                            src={value.cloudflareUrl}
                            alt={value.alt}
                            className="object-cover h-full w-full"
                            width={200}
                            height={200}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <form.Field name="images.items" mode="array">
                  {(subField) => (
                    <TemporyFilesSelectButton
                      maxFiles={
                        maxFiles - (field.state.value?.items.length ?? 0)
                      }
                      mimeType="image/*"
                      onSelectMoreFilesThanAllowed={() => {
                        console.log("ok");
                        toast.error(
                          `Upgrade to select more than ${maxFiles} files.`
                        );
                      }}
                      onSelect={(files) => {
                        console.log(files);
                        files.forEach((file) =>
                          subField.pushValue({
                            _type: "upload",
                            file: file,
                            isPrimary:
                              field.state.value === undefined
                                ? true
                                : subField.state.value.length === 0,
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
