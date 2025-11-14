import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ea/ui/card";
import { Button } from "@ea/ui/button";
import Link from "next/link";
import { match, P } from "ts-pattern";
import { TemporyFileSelectButton } from "@/components/select-file-button";
import { FileVideo } from "@/components/file-video";
import { toast } from "sonner";
import { RotateCwIcon, XIcon } from "lucide-react";
import { Stream } from "@cloudflare/stream-react";
import { defaultOptions, withForm } from "./context";
import { editProducerMediaFormValidator } from "@ea/validators/producers";

export function isUpload(
  value: (typeof editProducerMediaFormValidator.infer)["media"][number]
): value is Extract<
  (typeof editProducerMediaFormValidator.infer)["media"][number],
  { file: File }
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
  render: function ({ tier, form }) {
    if (
      tier !== "Free" &&
      (tier.tier === "premium" || tier.tier === "enterprise")
    ) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Video</CardTitle>
            <CardDescription>
              Upload a video with a maximum length of 2 minutes and maximum file
              size of 200mb.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="video">
              {(field) => (
                <div>
                  {!field.state.value ? (
                    <div>
                      <TemporyFileSelectButton
                        maxFileSize={200000000}
                        onSelectFileToLarge={() =>
                          toast.error("File must be less than 200mb")
                        }
                        mimeType="video/*"
                        onSelect={(v) =>
                          field.handleChange({
                            file: v,
                            position: 0,
                            id: crypto.randomUUID(),
                          })
                        }
                      >
                        Add Video
                      </TemporyFileSelectButton>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="p-2 flex gap-2 z-10 justify-end w-full absolute top-2 right-2">
                        <TemporyFileSelectButton
                          maxFileSize={200000000}
                          size={"icon"}
                          variant={"default"}
                          onSelectFileToLarge={() =>
                            toast.error("File must be less than 200mb")
                          }
                          mimeType="video/*"
                          onSelect={(v) =>
                            field.handleChange({
                              file: v,
                              position: 0,
                              id: crypto.randomUUID(),
                            })
                          }
                        >
                          <RotateCwIcon />
                        </TemporyFileSelectButton>
                        {/* <SelectFileButton
                          maxFileSize={200000000}
                          size={"icon"}
                          variant={"default"}
                          mimeType="video/*"
                          onSelectFileToLarge={() =>
                            toast.error("Video must be less than 200mb")
                          }
                          file={subField.state.value}
                          onChange={(f) => subField.handleChange(f as File)}
                        >
                          <RotateCwIcon />
                        </SelectFileButton> */}
                        <Button
                          onClick={() => field.handleChange(null)}
                          size={"icon"}
                          variant={"destructive"}
                        >
                          <XIcon />
                        </Button>
                      </div>
                      {match(field.state.value)
                        .with({ file: P.nonNullable }, (val) => (
                          <div className="w-full rounded overflow-hidden border aspect-video">
                            <FileVideo
                              controls
                              className="object-cover h-full w-full"
                              file={val.file}
                            />
                          </div>
                        ))
                        .with({ asset: P.nonNullable }, (val) => (
                          <div className="w-full rounded overflow-hidden border aspect-video">
                            {val.asset.videoStatus === "ready" ? (
                              <Stream
                                responsive={false}
                                width="100%"
                                height="100%"
                                className="object-cover h-full w-full"
                                controls
                                src={val.asset.cloudflareId ?? ""}
                              />
                            ) : (
                              <div className="p-20 flex flex-col gap-2 w-full h-full justify-center">
                                <p>
                                  Video is processing. Please wait a few
                                  seconds.
                                </p>
                                <Button
                                  onClick={() => {
                                    window.location.reload();
                                  }}
                                >
                                  Reload
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                        .exhaustive()}
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-amber-500/20">
        <CardHeader>
          <CardTitle>Video Upload (Premium Feature)</CardTitle>
          <CardDescription>
            Video uploads are available with Premium subscriptions. Showcase
            your operation with a compelling video!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={"/dashboard/billing/maybe"}>Upgrade to Premium</Link>
          </Button>
        </CardContent>
      </Card>
    );
  },
});
