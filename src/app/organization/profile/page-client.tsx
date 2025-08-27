"use client";

import { Certification } from "@/backend/db/schema";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { Listing } from "@/backend/validators/listings";
import { BackButton } from "@/components/back-button";
import { ProducerEditForm } from "@/components/forms/edit-producer-form";

export function ListingPageClient({
  listing,
  tier,
  allCertifications,
}: {
  listing: Listing;
  allCertifications: Certification[];
  tier: SubTier;
}) {
  return (
    <main className="p-10 overflow-auto flex flex-col gap-10 h-[calc(100vh_-_68px)] bg-muted">
      <div className="w-full self-center max-w-7xl">
        <BackButton text="Back home" href={"/"} />
      </div>
      <ProducerEditForm
        currentListing={listing}
        certifications={allCertifications}
        tier={tier}
      />
    </main>
  );
}
