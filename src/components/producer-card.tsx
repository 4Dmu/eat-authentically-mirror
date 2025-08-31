import { primaryImageUrl, producerSlugFull } from "@/utils/producers";
import { PublicProducerLight } from "@/backend/validators/producers";
import { Badge } from "./ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";

export function ProducerCard({ producer }: { producer: PublicProducerLight }) {
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
      <Button
        onClick={(e) => e.preventDefault()}
        size={"icon"}
        className="absolute top-4 right-4 cursor-pointer"
      >
        <MapPin />
      </Button>
    </Link>
  );
}
