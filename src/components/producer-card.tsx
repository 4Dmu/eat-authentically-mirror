import { primaryImageUrl, producerSlugFull } from "@/utils/producers";
import { PublicProducerLight } from "@/backend/validators/producers";
import { Badge } from "./ui/badge";
import Link from "next/link";
import Image from "next/image";

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
        <Badge className="absolute top-2 left-2">Unclaimed</Badge>
      )}
    </Link>
  );
}
