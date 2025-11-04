import { ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

export function ConfirmDeleteDialog(props: {
  children?: ReactNode | undefined;
  title?: ReactNode | undefined;
  description?: ReactNode | undefined;
  onDelete: () => void;
  onCancel?: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description && (
            <DialogDescription>{props.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild onClick={props.onCancel}>
            <Button>Cancel</Button>
          </DialogClose>
          <DialogClose asChild onClick={props.onDelete}>
            <Button>Delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
