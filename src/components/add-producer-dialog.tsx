import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerProducer } from "@/backend/rpc/producers";
import {
  PRODUCER_TYPES,
  RegisterProducerArgs,
  registerProducerArgsValidator,
} from "@/backend/validators/producers";
import { useForm } from "@tanstack/react-form";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { FieldInfo } from "./forms/helpers/field-info";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

export function AddProducerDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (val: boolean) => void;
}) {
  const client = useQueryClient();
  const registerProducerMutation = useMutation({
    mutationKey: ["register-producer"],
    mutationFn: async (data: RegisterProducerArgs) => {
      return await registerProducer(data);
    },
    onSuccess: async () => {
      toast.success("Producer created successfully.");
      client.invalidateQueries({ queryKey: ["fetch-user-producers"] });
      onOpenChange?.(false);
    },
    onError(e) {
      toast.error(e.message);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      about: "",
      type: "farm",
    } as typeof registerProducerArgsValidator.infer,
    validators: {
      onChange: (f) =>
        f.formApi.parseValuesWithSchema(registerProducerArgsValidator),
    },
    onSubmit({ value }) {
      registerProducerMutation.mutate(value);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        if (e === false) {
          form.reset();
        }
        onOpenChange?.(e);
      }}
    >
      <DialogTrigger asChild>
        <Button>Add New</Button>
      </DialogTrigger>
      <DialogContent className="sm:w-[90%] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Become a Producer</DialogTitle>
          <DialogDescription>
            Help customers find and connect with you by providing these details
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-5">
            <form.Field name="name">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label>
                    Proucer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter your form, ranch or business name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="type">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label>
                    Proucer Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(e) => field.handleChange(e as "farm")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {PRODUCER_TYPES.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="about">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label>
                    About Your Business <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Tell customers about your farm, ranch or eatery. What makes you special? What are your practices and values?"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>
          <DialogFooter>
            <form.Subscribe
              selector={(state) => state.isDirty && state.isValid}
            >
              {(isValid) => (
                <Button
                  className="w-40"
                  disabled={registerProducerMutation.isPending || !isValid}
                >
                  Create
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
