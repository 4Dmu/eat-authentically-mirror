import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { VariantProps } from "class-variance-authority";

import { ReactNode } from "react";
import { buttonVariants } from "./ui/button";

export function ConfirmDialog({
  children,
  title,
  description,
  cancelText,
  cancelAction,
  continueText,
  continueAction,
  cancelVariants,
  continueVariants,
  continueDisabled,
  cancelDisabled,
}: {
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode | undefined;
  cancelText?: ReactNode;
  cancelAction?: () => void;
  continueText?: ReactNode;
  continueAction?: () => void;
  cancelVariants?: VariantProps<typeof buttonVariants>;
  continueVariants?: VariantProps<typeof buttonVariants>;
  continueDisabled?: boolean;
  cancelDisabled?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={cancelDisabled}
            {...cancelVariants}
            onClick={cancelAction}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={continueDisabled}
            {...continueVariants}
            onClick={continueAction}
          >
            {continueText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
