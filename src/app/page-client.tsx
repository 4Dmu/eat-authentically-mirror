"use client";

import { FilterMenu } from "@/components/filter-menu";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProducerCard } from "@/components/producer-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHomePageStore } from "@/stores";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import { PublicProducerLight } from "@/backend/validators/producers";
import type { Geo } from "@vercel/functions";
import { HOME_PAGE_RESULT_LIMIT } from "@/backend/constants";
import { useSearchProducers } from "@/utils/producers";

export function Page({ userIpGeo }: { userIpGeo: Geo | undefined }) {
  const {
    typeFilter,
    query,
    certs,
    locationSearchArea,
    page,
    setPage,
    useIpGeo,
  } = useHomePageStore();

  const debouncedQuery = useDebounce(query, 500);

  const { data, isPlaceholderData } = useSearchProducers(
    {
      query: debouncedQuery,
    },
    { offset: page * HOME_PAGE_RESULT_LIMIT, limit: HOME_PAGE_RESULT_LIMIT }
  );

  return (
    <div className="flex flex-col gap-10  bg-gray-50">
      <HeroCarousel />
      <div className="p-5">
        <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-5">
          <div className="flex gap-5 justify-between items-center">
            <h2 className="font-bold text-3xl md:text-4xl text-gray-900">
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
              {/* <p className="text-muted-foreground ml-auto">
                ({data?.data.length} results)
              </p> */}
            </div>
          )}
          <div className="flex justify-between gap-5">
            <Button
              variant={"brandBrown"}
              size={"icon"}
              onClick={() => setPage((old) => Math.max(old - 1, 0))}
              disabled={page === 0}
            >
              <ArrowLeft />
            </Button>
            <Badge variant={"brandBrown"}>
              Page {page + 1} of{" "}
              {Math.ceil((data?.count ?? 1) / HOME_PAGE_RESULT_LIMIT)}
            </Badge>
            <Button
              variant={"brandBrown"}
              size={"icon"}
              onClick={() => {
                if (!isPlaceholderData && data?.hasMore) {
                  setPage((old) => old + 1);
                }
              }}
              // Disable the Next Page button until we know a next page is available
              disabled={isPlaceholderData || !data?.hasMore}
            >
              <ArrowRight />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data?.items.map((producer) => (
              <ProducerCard key={producer.id} producer={producer} />
            ))}
          </div>

          <div>
            <Button onClick={() => window.scrollTo({ top: 0 })}>
              <ArrowUp /> Back to top
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
