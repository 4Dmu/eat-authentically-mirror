import { getListingPublic } from "@/backend/data/listing";
import { BackButton } from "@/components/back-button";
import { AddToPinboardButton } from "@/components/pinboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { listingSlug } from "@/utils/listings";
import { GlobeIcon, MailIcon, MapPin, PhoneIcon } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { ClaimListingCard } from "@/components/claim-listing-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { countryByAlpha3Code } from "@/utils/contries";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = slug.substring(slug.length - 36);
  const receivedSlug = slug.substring(0, slug.length - 36);

  const listing = await getListingPublic({ id: id });

  if (!listing) {
    notFound();
  }

  const correctSlug = listingSlug(listing.name);
  if (receivedSlug !== correctSlug) {
    redirect(`${correctSlug}${listing.id}`);
  }

  return (
    <div>
      <div className="p-10 flex flex-col gap-10 max-w-7xl mx-auto">
        <div className="flex gap-5 justify-between">
          <BackButton text="Return Home" href="/" />
          <AddToPinboardButton />
        </div>
        <div className="flex flex-col md:flex-row gap-5">
          <Card className="pt-0 overflow-hidden flex-5/8">
            <Carousel>
              <CarouselContent>
                {listing.images
                  .toSorted((a, b) =>
                    a.isPrimary && b.isPrimary ? 0 : a.isPrimary ? -1 : 1
                  )
                  .map((img) => (
                    <CarouselItem key={img.cloudflareId}>
                      <Image
                        priority
                        alt=""
                        className="w-full h-full object-cover aspect-video"
                        width={1920}
                        height={1080}
                        src={img.cloudflareUrl}
                      />
                    </CarouselItem>
                  ))}
              </CarouselContent>
              <CarouselNext />
              <CarouselPrevious />
            </Carousel>
            <CardHeader>
              <h1 className="font-bold text-4xl">{listing.name}</h1>
              <Badge>{listing.type}</Badge>
            </CardHeader>
            <CardContent className="whitespace-break-spaces">
              {listing.about}
            </CardContent>
          </Card>
          <div className="flex-3/8 flex flex-col gap-5">
            <Card className="">
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label>
                    <MailIcon size={20} />
                    Email
                  </Label>
                  <a
                    className="underline"
                    href={`mailto:${listing.contact?.email}`}
                  >
                    {listing.contact?.email}
                  </a>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>
                    <PhoneIcon size={20} />
                    Phone
                  </Label>
                  <a
                    className="underline"
                    href={`tel:${listing.contact?.phone}`}
                  >
                    {listing.contact?.phone}
                  </a>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>
                    <GlobeIcon size={20} />
                    Website
                  </Label>
                  <a className="underline" href={listing.contact?.website}>
                    {listing.contact?.website}
                  </a>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>
                    <MapPin size={20} />
                    Map
                  </Label>
                  {listing?.address && (
                    <div>
                      {listing.address.street}, {listing.address.city},{" "}
                      {listing.address.state}, {listing.address.zip},{" "}
                      {listing.address.country &&
                        countryByAlpha3Code(listing.address.country).name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {!listing.claimed && <ClaimListingCard name={listing.name} />}
          </div>
        </div>
      </div>
    </div>
  );
}
