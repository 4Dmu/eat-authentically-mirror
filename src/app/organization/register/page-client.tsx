"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  LISTING_TYPES,
  registerListingArgsValidator,
  RegisterListingArgs,
} from "@/backend/validators/listings";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useMutation } from "@tanstack/react-query";
import { registerOrganization } from "@/backend/rpc/organization";
import { BackButton } from "@/components/back-button";
import { useRouter } from "next/navigation";

export function ClientPage() {
  const router = useRouter();
  const registerOrganizationMutation = useMutation({
    mutationKey: ["register-organization"],
    mutationFn: async (data: RegisterListingArgs) => {
      return await registerOrganization(data);
    },
    onSuccess: () => {
      router.push("/organization/subscribe");
    },
  });

  const form = useForm<typeof registerListingArgsValidator.infer>({
    resolver: arktypeResolver(registerListingArgsValidator),
    defaultValues: {
      name: "",
      about: "",
    },
  });

  function onSubmit(values: typeof registerListingArgsValidator.infer) {
    registerOrganizationMutation.mutate(values);
  }
  return (
    <div className="p-10 flex flex-col gap-5 mx-auto max-w-7xl">
      <BackButton text="Back To Home" href="/" />
      <h1 className="font-bold">Become a Producer</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>
                Help customers find and connect with you by providing these
                details
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Proucer Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your form, ranch or business name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Business Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your business type" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {LISTING_TYPES.map((p) => (
                            <SelectItem
                              key={p}
                              value={p}
                              className="capitalize"
                            >
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      About Your Business{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell customers about your farm, ranch or eatery. What makes you special? What are your practices and values?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <div className="flex w-full justify-end">
            <Button
              className="w-40"
              disabled={
                registerOrganizationMutation.isPending ||
                form.formState.isSubmitting
              }
            >
              Create
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
