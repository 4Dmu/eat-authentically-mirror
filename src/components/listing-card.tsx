import { listingSlug, primaryImageUrl } from "@/utils/listings";
import { PublicListingLight } from "@/backend/validators/listings";
import { Badge } from "./ui/badge";
import Link from "next/link";
import Image from "next/image";

export function ListingCard({ listing }: { listing: PublicListingLight }) {
  return (
    <Link
      href={`/listings/${listingSlug(listing.name)}${listing.id}`}
      className="border rounded-lg overflow-hidden relative shadow-lg"
    >
      <Image
        width={1920}
        height={1080}
        alt=""
        className="w-full grow object-cover aspect-video border-b"
        src={primaryImageUrl(listing)}
      />
      <div className="p-5">
        <p className="font-bold">{listing.name}</p>
      </div>
      {!listing.claimed && (
        <Badge className="absolute top-2 left-2">Unclaimed</Badge>
      )}
    </Link>
  );
}
