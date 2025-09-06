import { primaryImageUrl, producerSlugFull } from "@/utils/producers";
import { PublicProducerLight } from "@/backend/validators/producers";
import { Badge } from "./ui/badge";
import Link from "next/link";
import Image from "next/image";
import { AddToPinboardIconButton } from "./pinboard";

export function ProducerCard({
  producer,
  mode = "default",
}: {
  producer: Pick<PublicProducerLight, "name" | "images" | "id" | "claimed">;
  mode?: "default" | "list";
}) {
  if (mode === "list") {
    return (
      <Link
        href={`/producers/${producerSlugFull(producer)}`}
        className="border rounded-lg overflow-hidden shadow-lg flex"
      >
        <div className="relative max-sm:hidden">
          <Image
            width={200}
            height={200}
            alt=""
            className="object-cover h-full border-b aspect-video"
            src={primaryImageUrl(producer)}
          />
          {!producer.claimed && (
            <Badge variant={"brandBrown"} className="absolute top-4 left-4">
              Unclaimed
            </Badge>
          )}
        </div>
        <div className="p-5 flex gap-3 justify-between items-center w-full">
          <p className="font-bold">{producer.name}</p>
          <AddToPinboardIconButton producerId={producer.id} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/producers/${producerSlugFull(producer)}`}
      className="border rounded-lg overflow-hidden relative shadow-lg"
    >
      <Image
        width={1920}
        height={1080}
        alt=""
        className="w-full grow object-cover aspect-video border-b"
        src={primaryImageUrl(producer)}
      />
      <div className="p-5">
        <p className="font-bold">{producer.name}</p>
      </div>
      {!producer.claimed && (
        <Badge variant={"brandBrown"} className="absolute top-4 left-4">
          Unclaimed
        </Badge>
      )}
      <AddToPinboardIconButton
        className="absolute top-4 right-4 cursor-pointer"
        producerId={producer.id}
      />
    </Link>
  );
}
