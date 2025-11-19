"use client";
import type { SuggestedProducerSelect } from "@ea/db/schema";
import { Button } from "@ea/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ea/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ea/ui/dialog";
import { Input } from "@ea/ui/input";
import { Label } from "@ea/ui/label";
import { Textarea } from "@ea/ui/textarea";
import { approveSuggestedProducerArgs } from "@ea/validators/producers";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useApproveSuggestedProducer,
  useListSuggestedProducers,
} from "@/client/data";
import { AppWrapper } from "@/components/app-wrapper";
import { FieldInfo } from "@/components/forms/helpers/field-info";
import type { SuggestedProducersListItem } from "@/rpc/suggested-producers";

export function SuggestedProducersPage({
  suggested,
}: {
  suggested: SuggestedProducersListItem[];
}) {
  const producers = useListSuggestedProducers({
    initialData: suggested,
  });

  return (
    <AppWrapper
      crumbs={[{ url: "/", name: "EA Admin" }]}
      end="Suggested Producers"
    >
      <div className="flex justify-center p-10">
        <div className="flex flex-col w-full gap-5">
          <h1 className="font-bold text-2xl">List Suggested Producers</h1>
          <div>
            {producers.data?.map((producer) => (
              <Card key={producer.id}>
                <CardHeader>
                  <CardTitle>
                    "{producer.name}" suggested by{" "}
                    {producer.suggesterUserData?.first_name}{" "}
                    {producer.suggesterUserData?.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label>Name</Label>
                    <Input readOnly defaultValue={producer.name} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <Input readOnly defaultValue={producer.type} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex flex-col gap-2">
                      <Label>Email</Label>
                      {producer.email ? (
                        <Input readOnly defaultValue={producer.email} />
                      ) : (
                        <p>No email provided</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Phone</Label>
                      {producer.phone ? (
                        <Input readOnly defaultValue={producer.phone} />
                      ) : (
                        <p>No phone provided</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Address</Label>
                    {producer.address ? (
                      <Textarea
                        readOnly
                        defaultValue={`${producer.address?.street}, ${producer.address?.city}, ${producer.address?.state}, ${producer.address?.zip}, ${producer.address?.country}`}
                      />
                    ) : (
                      <p>No address provided</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <ApproveDialog suggested={producer} />
                  <Button variant={"destructive"}>Reject</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}

function ApproveDialog({ suggested }: { suggested: SuggestedProducerSelect }) {
  const producers = useListSuggestedProducers();
  const router = useRouter();
  const approve = useApproveSuggestedProducer({
    onSuccess: async (d) => {
      await producers.refetch();
      toast.success("Suggestion approved");
      router.push(`/producers/${d}`);
    },
  });

  const approveWithDataForm = useForm({
    defaultValues: {
      lat: undefined as unknown as string,
      lng: undefined as unknown as string,
      about: "",
    },
    validators: {
      onChange: ({ formApi }) =>
        formApi.parseValuesWithSchema(
          approveSuggestedProducerArgs.get("additional")
        ),
    },
    onSubmit({ value }) {
      approve.mutate({ suggestedProducerId: suggested.id, additional: value });
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Approve</Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            approveWithDataForm.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Data Needed</DialogTitle>
            <DialogDescription>
              Add a lat/lng to address for location search.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <approveWithDataForm.Field name="lat">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label>Lat</Label>
                  <Input
                    value={
                      field.state.value ? field.state.value.toString() : ""
                    }
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </approveWithDataForm.Field>
            <approveWithDataForm.Field name="lng">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label>Lng</Label>
                  <Input
                    value={
                      field.state.value ? field.state.value.toString() : ""
                    }
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </approveWithDataForm.Field>
          </div>
          <approveWithDataForm.Field name="about">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label>About</Label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </approveWithDataForm.Field>
          <DialogFooter>
            <Button>Approve</Button>
            <DialogClose asChild>
              <Button variant={"secondary"}>Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
