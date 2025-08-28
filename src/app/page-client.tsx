"use client";

import { FilterMenu } from "@/components/filter-menu";
import { HeroCarousel } from "@/components/hero-carousel";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHomePageStore } from "@/stores";
import { producersQueryOptions } from "@/utils/producers";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";

export function Page() {
  const { typeFilter, query, certs, locationSearchArea, page, setPage } =
    useHomePageStore();

  const debouncedQuery = useDebounce(query, 500);

  const { data, isPlaceholderData } = useQuery(
    producersQueryOptions({
      type: typeFilter,
      page: page,
      certs: certs.map((cert) => cert.id),
      locationSearchArea: locationSearchArea
        ? locationSearchArea.toJSON()
        : undefined,
      query: debouncedQuery,
    })
  );

  return (
    <div className="flex flex-col gap-10  bg-gray-50">
      <HeroCarousel />
      <div className="p-5">
        <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-5">
          <div className="flex gap-5 justify-between">
            <h2 className="font-bold text-4xl text-gray-900">
              Find Real Food Producers
            </h2>
            <FilterMenu />
          </div>
          <p className="font-inter text-lg text-gray-600 max-w-2xl">
            Find sustainable farms, ranches, and eateries committed to real food
          </p>
          {(certs.length > 0 || typeFilter || query || locationSearchArea) && (
            <div className="flex flex-wrap bg-white gap-3 border p-5 rounded-lg">
              <p>Active filters:</p>
              {typeFilter && <Badge>Type: {typeFilter}</Badge>}
              {query && <Badge>Name Search: {query}</Badge>}
              {locationSearchArea && (
                <Badge>Location Filter: Your Selected Area</Badge>
              )}
              {certs.length > 0 && (
                <Badge className="flex-wrap">
                  Cert:{" "}
                  {certs.map((cert) => (
                    <span key={cert.name}>{cert.name}</span>
                  ))}
                </Badge>
              )}
              <p className="text-muted-foreground ml-auto">
                ({data?.data.length} results)
              </p>
            </div>
          )}
          <div className="flex justify-between gap-5">
            <span>Current Page: {page + 1}</span>
            <div className="flex gap-2">
              <Button
                size={"icon"}
                onClick={() => setPage((old) => Math.max(old - 1, 0))}
                disabled={page === 0}
                hidden={page === 0}
              >
                <ArrowLeft />
              </Button>
              <Button
                size={"icon"}
                onClick={() => {
                  if (!isPlaceholderData && data?.hasNextPage) {
                    setPage((old) => old + 1);
                  }
                }}
                // Disable the Next Page button until we know a next page is available
                disabled={isPlaceholderData || !data?.hasNextPage}
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data?.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
