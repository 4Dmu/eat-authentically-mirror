"use client";
import Image from "next/image";
import Link from "next/link";
import { ProducerCardsRow } from "@ea/db/schema";
import {
  AddProducerDialog,
  producerDialogAtom,
} from "@/components/add-producer-dialog";
import { ClaimProducerDialog } from "@/components/claim-producer-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDeleteProducer,
  useFetchUserProducers,
  producerSlugFull,
} from "@/utils/producers";
import { useAtom } from "jotai";
import { BuildingIcon, EyeIcon, EditIcon, TrashIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function ProducersSection({
  producers,
}: {
  producers: ProducerCardsRow[];
}) {
  const [producerDialogOpen, setProducerDialogOpen] =
    useAtom(producerDialogAtom);
  const searchparams = useSearchParams();
  const router = useRouter();
  const deleteProducer = useDeleteProducer();
  const { data } = useFetchUserProducers({ initialData: producers });

  async function handleDeleteProducer(producer: { id: string; name: string }) {
    const deletePromise = deleteProducer.mutateAsync({
      producerId: producer.id,
    });
    toast.promise(deletePromise, {
      loading: `Deleting producer: ${producer.name}`,
      success: `Deleted producer ${producer.name} succesfully`,
      error: `Error deleting producer ${producer.name}`,
    });
    await deletePromise;
  }

  const mode = searchparams.get("mode");

  useEffect(() => {
    if (mode === "become-producer") {
      setProducerDialogOpen(true);
      const newParams = new URLSearchParams(searchparams);
      newParams.delete("mode");
      router.replace(`?${newParams.toString()}`);
    }
  }, [mode, router, searchparams]);

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BuildingIcon />
          My Producer Profiles
        </CardTitle>
        <CardAction className="flex gap-2">
          <AddProducerDialog
            open={producerDialogOpen}
            onOpenChange={setProducerDialogOpen}
          >
            <Button variant={"secondary"}>Add New</Button>
          </AddProducerDialog>
          <ClaimProducerDialog>
            <Button variant={"outline"}>Claim</Button>
          </ClaimProducerDialog>
        </CardAction>
      </CardHeader>
      {(data?.length ?? 0) > 0 && (
        <CardContent className="grid md:grid-cols-2 gap-10">
          {data?.map((p) => (
            <Card key={p.id} className="rounded-lg overflow-hidden pt-0 gap-0">
              {p.thumbnailUrl ? (
                <Image
                  src={p.thumbnailUrl}
                  alt=""
                  className="w-full object-cover aspect-video"
                  width={600}
                  height={600}
                />
              ) : (
                <div></div>
              )}
              <CardContent className="p-5 flex flex-col gap-2">
                <p className="font-fraunces text-lg">{p.name}</p>
                <Badge>{p.type}</Badge>
                <p>{p.summary}</p>
              </CardContent>
              <CardFooter className="grid grid-cols-3 gap-2 mt-auto">
                <Button variant={"outline"} asChild>
                  <Link href={`/producers/${producerSlugFull(p)}`}>
                    <EyeIcon />
                    View
                  </Link>
                </Button>
                <Button variant={"outline"} asChild>
                  <Link href={`/dashboard/producers/${p.id}`}>
                    <EditIcon />
                    Edit
                  </Link>
                </Button>
                <div>
                  <ConfirmDeleteDialog
                    onDelete={() => handleDeleteProducer(p)}
                    title={`Are your sure you want to delete ${p.name}?`}
                    description="This action is final and will permenantly delete this producer and all its associated content and data."
                  >
                    <Button
                      disabled={deleteProducer.isPending}
                      size={"icon"}
                      variant={"destructive"}
                    >
                      <TrashIcon />
                    </Button>
                  </ConfirmDeleteDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
