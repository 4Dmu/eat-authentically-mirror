import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RefObject } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FieldInfo } from "@/components/forms/helpers/field-info";
import { waitlistRegisterArgs } from "@/backend/validators/waitlist";
import { waitlistRegister } from "@/backend/rpc/waitlist";

export function ConsumerForm({
  ref,
}: {
  ref: RefObject<HTMLInputElement | null>;
}) {
  const router = useRouter();
  const waitlistRegisterMutation = useMutation({
    mutationKey: ["waitlist-register"],
    mutationFn: async (args: typeof waitlistRegisterArgs.infer) =>
      await waitlistRegister(args),
    onError: (e) => toast.error(e.message),
    onSuccess: () => router.push("/waitlist-success"),
  });

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: ({ formApi }) =>
        formApi.parseValuesWithSchema(waitlistRegisterArgs),
    },
    onSubmit: ({ value }) => waitlistRegisterMutation.mutate(value),
  });

  return (
    <Card className="w-full" id="consumer">
      <CardHeader>
        <CardTitle className="text-3xl font-fraunces">
          Discover where real food lives
        </CardTitle>
        <CardDescription>
          Be the first to explore authentic farms, ranches, and eateries near
          you. Join our wait list and get early access to Eat Authentically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className=" flex flex-col gap-2"
        >
          <form.Field name="email">
            {(field) => (
              <div>
                <Input
                  ref={ref}
                  placeholder="Email"
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <Button>Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
}
