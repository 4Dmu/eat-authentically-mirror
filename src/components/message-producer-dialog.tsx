"use client";
import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { PublicProducerLight } from "@/backend/validators/producers";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { type } from "arktype";
import { FieldInfo, FormInfo } from "./forms/helpers/field-info";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getProducerChatOpts,
  sendMessageToProducerOpts,
} from "@/utils/messages";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { match, P } from "ts-pattern";
import Link from "next/link";

const formSchema = type({
  message: type.string.atLeastLength(5).atMostLength(5000),
});

export function MessageProducerDialog({
  producer,
  disabled,
}: {
  producer: PublicProducerLight;
  disabled: boolean;
}) {
  const chatQuery = useQuery(getProducerChatOpts({ producerId: producer.id }));
  const router = useRouter();
  const sendMessage = useMutation(
    sendMessageToProducerOpts({
      onError: (e) => toast.error(e.message),
      onSuccess: async () => await chatQuery.refetch(),
    }),
  );

  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onChange: ({ formApi }) => formApi.parseValuesWithSchema(formSchema),
      onSubmit: ({ formApi }) => formApi.parseValuesWithSchema(formSchema),
    },
    onSubmit: async ({ value }) => {
      const promise = sendMessage.mutateAsync({
        producerId: producer.id,
        message: value.message,
      });

      toast.promise(promise, {
        loading: "Sending message...",
        success: (e) => ({
          message: "Would you like to view this chat?",
          duration: 5000,
          action: {
            label: "View Chat",
            onClick: () => router.push(`/dashboard/chats/${e}`),
          },
        }),
        error: "Error sending message.",
      });

      await promise;
      setOpen(false);
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open]);

  function submit() {
    form.handleSubmit();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {match(chatQuery)
        .with({ status: "pending" }, () => (
          <Button className="w-28" disabled variant={"brandGreen"}>
            Loading...
          </Button>
        ))
        .with({ data: P.nonNullable }, (query) => (
          <Button
            className="w-28"
            disabled={disabled}
            variant={"brandGreen"}
            asChild
          >
            <Link href={`/dashboard/chats/${query.data.id}`}>
              <Send />
              View Chat
            </Link>
          </Button>
        ))
        .otherwise(() => (
          <DialogTrigger asChild disabled={disabled}>
            <Button className="w-28" variant={"brandGreen"}>
              <Send />
              Message
            </Button>
          </DialogTrigger>
        ))}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {producer.name}</DialogTitle>
        </DialogHeader>
        <div>
          <form.Field name="message">
            {(field) => (
              <div className="flex flex-col gap-1">
                <Textarea
                  className="min-h-40 resize-none"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo
                  otherwise={<p className="h-[24px]">{}</p>}
                  field={field}
                />
              </div>
            )}
          </form.Field>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"brandRed"} className="w-32">
              Cancel
            </Button>
          </DialogClose>
          <form.Subscribe selector={(state) => state.canSubmit}>
            {(canSubmit) => (
              <Button
                onClick={submit}
                disabled={!canSubmit}
                variant={"brandGreen"}
                className="w-32"
              >
                Send
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
