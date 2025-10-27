import Link from "next/link";
import Image from "next/image";
import { primaryImageUrl, producerSlugFull } from "@/utils/producers";
import { Badge } from "./ui/badge";
import { AddToPinboardIconButton } from "./pinboard";
import { SignedIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ProducerCardsRow, ProducerWith } from "@/backend/db/schema";
import { MapPin, NavigationIcon, StarIcon } from "lucide-react";
import { countryByAlpha3Code } from "@/utils/contries";
import { useGeolocationStore } from "@/stores";
import { useMemo } from "react";
import { Button } from "./ui/button";
import type { Geo } from "@vercel/functions";

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function PublicProducerCard({
  producer,
  className,
  userIpGeo,
}: {
  producer:
    | ProducerWith<"media" | "ratingAgg" | "location" | "search">
    | Omit<
        ProducerCardsRow,
        "userId" | "subscriptionRank" | "reviewCount" | "ratingSum"
      >;
  className?: string;
  userIpGeo: Geo | undefined;
}) {
  const location = useGeolocationStore((s) => s.state);

  const distanceFromUserInKM = useMemo(() => {
    const coords = location?.positionError
      ? userIpGeo
        ? {
            latitude: userIpGeo?.latitude
              ? Number(userIpGeo?.latitude)
              : undefined,
            longitude: userIpGeo?.longitude
              ? Number(userIpGeo?.longitude)
              : undefined,
          }
        : undefined
      : location?.position?.coords;

    const lat1 = coords?.latitude;
    const lat2 =
      "location" in producer ? producer.location?.latitude : producer.latitude;
    const lon1 = coords?.longitude;
    const lon2 =
      "location" in producer
        ? producer.location?.longitude
        : producer.longitude;

    if (!lat1 || !lat2 || !lon1 || !lon2) {
      return;
    }

    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }, [location, producer, userIpGeo]);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden flex flex-col relative shadow-lg h-full group transition-all hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      <Link
        prefetch={true}
        href={`/producers/${producerSlugFull(producer)}`}
        className="overflow-hidden relative"
      >
        <Image
          width={1920}
          height={1080}
          alt=""
          className="w-full grow object-cover aspect-[4/3] border-b group-hover:scale-105 transition"
          src={primaryImageUrl(producer)}
        />
      </Link>
      <div className="p-5 flex flex-col gap-5 flex-1">
        <div className="flex gap-5 justify-between">
          <p className="font-bold">{producer.name}</p>
          <div>
            <Badge variant={"secondary-light"}>{producer.type}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-brand-green" />
          <p className="text-brand-green">
            {"adminArea" in producer
              ? `${producer.city ?? ""}, ${producer.adminArea ?? (producer.country ? countryByAlpha3Code(producer.country)?.name : undefined) ?? ""}`
              : `${producer.location?.city ?? ""}, ${producer.location?.adminArea ?? ""}`}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <NavigationIcon className="h-4 w-4 text-brand-green" />
            <p>{distanceFromUserInKM} km</p>
          </div>
        </div>
        <p className="text-sm">
          {producer.summary?.substring(0, 100)}
          ...
        </p>
        <div className="flex gap-2">
          <Button variant={"default"} asChild className="flex-1">
            <Link
              prefetch={true}
              href={`/producers/${producerSlugFull(producer)}`}
            >
              View Details
            </Link>
          </Button>
          <SignedIn>
            <AddToPinboardIconButton producerId={producer.id} />
          </SignedIn>
        </div>
      </div>
      {!("isClaimed" in producer
        ? producer.isClaimed
        : producer.userId !== null) && (
        <Badge variant={"secondary"} className="absolute top-4 left-4">
          Unclaimed
        </Badge>
      )}
      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm">
        <StarIcon className="h-4 w-4 fill-secondary text-secondary" />
        <p className="text-sm font-semibold">
          {"ratingAgg" in producer
            ? producer.ratingAgg
              ? (
                  ((producer.ratingAgg.ratingSum + 10 * 4.2) * 1.0) /
                  (producer.ratingAgg.reviewCount + 10)
                ).toPrecision(2)
              : "0.0"
            : (producer.bayesAvg?.toPrecision(2) ?? "0.0")}
        </p>
      </div>
    </div>
  );
}
