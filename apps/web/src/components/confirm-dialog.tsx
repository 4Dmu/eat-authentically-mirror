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
} from "@ea/ui/alert-dialog";
import type { VariantProps } from "class-variance-authority";

import type { ReactNode } from "react";
import type { buttonVariants } from "@ea/ui/button";

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
