import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { editListingFormVideoValidator } from "@/backend/validators/listings";
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from "@tanstack/react-form";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

export const videoOpts = formOptions({
  defaultValues: {
    video: undefined as unknown as File,
  } satisfies typeof editListingFormVideoValidator.infer as typeof editListingFormVideoValidator.infer,
});

export const useVideoForm = useAppForm;

export const VideoForm = withForm({
  ...videoOpts,
  props: {
    tier: "Free" as SubTier,
  },
  render: function ({ tier }) {
    if (tier !== "Free" && tier.tier === "premium") {
      return <Card></Card>;
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
            <Link href={"/"}>Upgrade to Premium</Link>
          </Button>
        </CardContent>
      </Card>
    );
  },
});
