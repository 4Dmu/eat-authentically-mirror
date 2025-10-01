import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useForm } from "@tanstack/react-form";
import { FieldInfo } from "./forms/helpers/field-info";
import { newPinListArgs } from "@/backend/validators/pinboard";
import { useNewPinlist, useUserPinboardFull } from "@/utils/pinboard";

export function NewPinlistDialog() {
  const [open, onOpenChange] = useState(false);
  const pinboard = useUserPinboardFull();

  const newPinList = useNewPinlist({
    async onSuccess() {
      await pinboard.refetch();
      form.reset();
      onOpenChange(false);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: (f) => {
        return f.formApi.parseValuesWithSchema(newPinListArgs);
      },
    },
    onSubmit({ value }) {
      newPinList.mutate(value);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger disabled={newPinList.isPending} asChild>
        <Button>Add List</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Pinlist</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-3"
        >
          <form.Field name="name">
            {(field) => (
              <div>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="Name"
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <Button>Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
