"use client";
import { BackButton } from "@/components/back-button";
import {
  AddToPinboardButton,
  AddToPinboardButtonRedirectToAuth,
} from "@/components/pinboard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFullProducerPublic, useProducerPublic } from "@/utils/producers";
import { GlobeIcon, MailIcon, MapPin, PhoneIcon } from "lucide-react";
import { ClaimProducerCard } from "@/components/claim-producer-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { countryByAlpha3Code } from "@/utils/contries";
import { Stream } from "@/components/stream";
import { NotSubbed, Subbed } from "@/components/auth/RequireSub";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import {
  CommunityBenefitsCard,
  CommunityBenefitsCTACard,
} from "@/components/community-benefits-card";
import { MapCard } from "@/components/map-card";
import { cn } from "@/lib/utils";
import { PublicProducer } from "@/backend/validators/producers";
import {
  useReviewsPublic,
  useReviewProducerPendingState,
} from "@/utils/reviews";
import Image from "next/image";
import { PendingReviewCard, ReviewCard } from "@/components/review-card";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ProducerWithAll } from "@/backend/db/schema";
import React from "react";

export function ProducerPageClient(props: {
  producer: ProducerWithAll;
  subTier: SubTier;
  userProducerIds: string[];
}) {
  const { data: producer } = useFullProducerPublic(props.producer.id);
  const reviews = useReviewsPublic(props.producer.id);
  const pendingReviews = useReviewProducerPendingState();

  const hasAddress =
    producer &&
    producer.location !== null &&
    Object.entries(producer.location).some(
      (v) => v[1] !== null && v[1] !== undefined
    );

  const hasContact =
    producer &&
    producer.contact !== null &&
    Object.entries(producer.contact).some(
      (v) => v[1] !== null && v[1] !== undefined
    );

  const communityBenefitsCard = (
    <>
      {producer && (
        <>
          <Subbed initialSubTier={props.subTier}>
            <CommunityBenefitsCard
              userProducerIds={props.userProducerIds}
              producer={producer}
            />
          </Subbed>
          <NotSubbed>
            <CommunityBenefitsCTACard />
          </NotSubbed>
        </>
      )}
    </>
  );

  const claimProducerCard = (
    <>
      {producer && producer.userId === null && (
        <ClaimProducerCard id={producer.id} name={producer.name} />
      )}
    </>
  );

  const mapCard = (
    <>
      {producer && producer.location && (
        <MapCard
          maps={producer.googleMapsPlaceDetails}
          location={producer.location}
        />
      )}
    </>
  );

  const contactCard = (
    <>
      {producer && hasContact && (
        <Card className="">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 break-all">
            {producer.contact?.email && (
              <div className="flex flex-col gap-2">
                <Label>
                  <MailIcon size={20} />
                  Email
                </Label>
                <a
                  className="underline"
                  href={`mailto:${producer.contact?.email}`}
                >
                  {producer.contact?.email}
                </a>
              </div>
            )}
            {producer.contact?.phone && (
              <div className="flex flex-col gap-2">
                <Label>
                  <PhoneIcon size={20} />
                  Phone
                </Label>
                <a
                  className="underline"
                  href={`tel:${producer.contact?.phone}`}
                >
                  {producer.contact?.phone}
                </a>
              </div>
            )}
            {producer.contact?.websiteUrl && (
              <div className="flex flex-col gap-2">
                <Label>
                  <GlobeIcon size={20} />
                  Website
                </Label>
                <a className="underline" href={producer.contact?.websiteUrl}>
                  {producer.contact?.websiteUrl}
                </a>
              </div>
            )}
            {hasAddress && producer.location !== null && (
              <div className="flex flex-col gap-2">
                <Label>
                  <MapPin size={20} />
                  Address
                </Label>
                <div className="flex flex-col gap-2">
                  <div>
                    {producer.location.locality &&
                      `${producer.location.locality}, `}
                    {producer.location.city && `${producer.location.city}, `}
                    {producer.location.adminArea &&
                      `${producer.location.adminArea}, `}
                    {producer.location.postcode &&
                      `${producer.location.postcode}, `}
                    {producer.location.country &&
                      countryByAlpha3Code(producer.location.country)?.name}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );

  const reviewsCard = (
    <>
      {((reviews.data && reviews.data.length > 0) ||
        pendingReviews.length > 0) && (
        <Card className="pb-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>
              Here&apos;s what people are saying about {producer?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-gray-50 p-5 border-t">
            <div className="grid md:grid-cols-2 gap-5">
              {reviews.data?.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
              {pendingReviews.map((r, i) => (
                <PendingReviewCard review={r} key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <div>
      <div className="p-3 sm:p-10 flex flex-col gap-5 max-w-7xl mx-auto">
        <div className="flex gap-5 justify-between">
          <BackButton text="Return Home" href="/" />
          <SignedIn>
            <AddToPinboardButton
              producerId={producer?.id ?? props.producer.id}
            />
          </SignedIn>
          <SignedOut>
            <AddToPinboardButtonRedirectToAuth />
          </SignedOut>
        </div>
        <div className="flex flex-col lg:flex-row gap-5">
          {producer && (
            <div className="flex-5/8 flex flex-col gap-5">
              <Card
                className={cn(
                  "overflow-hidden flex-1",
                  producer.media.length > 0 && "pt-0"
                )}
              >
                {producer.media.length > 0 && (
                  <Carousel>
                    <CarouselContent className="">
                      {producer.media.map((item) => (
                        <React.Fragment key={item.assetId}>
                          {item.role === "video" ? (
                            <CarouselItem>
                              <Stream
                                responsive={false}
                                width="100%"
                                height="100%"
                                className="object-cover h-full w-full"
                                controls
                                src={item.asset.cloudflareId ?? ""}
                              />
                            </CarouselItem>
                          ) : (
                            <CarouselItem>
                              <Image
                                priority
                                alt=""
                                className="w-full h-full object-cover aspect-video"
                                width={1920}
                                height={1080}
                                src={item.asset.url}
                              />
                            </CarouselItem>
                          )}
                        </React.Fragment>
                      ))}
                    </CarouselContent>
                    <CarouselNext />
                    <CarouselPrevious />
                  </Carousel>
                )}
                <CardHeader>
                  <h1 className="font-bold text-4xl">{producer.name}</h1>
                  <Badge>{producer.type}</Badge>
                </CardHeader>
                <CardContent className="whitespace-pre-wrap">
                  {producer.about?.replace(/\\n/g, "\n")}
                </CardContent>
              </Card>
              {hasAddress && communityBenefitsCard}
              <div className="max-lg:hidden">{reviewsCard}</div>
            </div>
          )}
          <div className="flex-3/8 flex flex-col gap-5">
            {claimProducerCard}
            {contactCard}
            {mapCard}
            {!hasAddress && communityBenefitsCard}
            <div className="lg:hidden">{reviewsCard}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
