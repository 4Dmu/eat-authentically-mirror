"use client";

import { FilterMenu } from "@/components/filter-menu";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGeolocationStore, useHomePageStore } from "@/stores";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import type { Geo } from "@vercel/functions";
import { HOME_PAGE_RESULT_LIMIT } from "@/backend/constants";
import { useSearchProducers } from "@/utils/producers";
import { RequestLocation } from "@/components/request-location";
import { PublicProducerCard } from "@/components/public-producer-card";
import { omit } from "remeda";

export function Page({ userIpGeo }: { userIpGeo: Geo | undefined }) {
  const { typeFilter, query, certs, locationSearchArea, page, setPage } =
    useHomePageStore();

  const debouncedQuery = useDebounce(query, 500);

  const userLocation = useGeolocationStore((s) => s.state);

  const { data, isPlaceholderData, isEnabled, isPending } = useSearchProducers(
    {
      query: debouncedQuery,
    },
    { offset: page * HOME_PAGE_RESULT_LIMIT, limit: HOME_PAGE_RESULT_LIMIT },
    { position: userLocation?.position }
  );

  return (
    <div className="flex flex-col gap-10  bg-gray-50">
      <RequestLocation />
      <div className="h-[70vh] min-h-[500px] w-full relative">
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/FRF_Home.jpg)] animate-[fade1_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/FRF_Eaterie_Default.jpg)] animate-[fade2_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/FRF_Ranch_Default.jpg)] animate-[fade3_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/Ranch_Default2.jpg)] animate-[fade4_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/tomatoesontable.jpg)] animate-[fade5_150s_infinite]" />
        {/* <div className="w-full h-full absolute top-0 left-0 bg-[url(/hero/FRF_Eaterie_Default.jpg)] bg-cover bg-center" /> */}
        {/* <div className="w-full h-full absolute top-0 left-0 bg-[url(https://images.unsplash.com/photo-1595855759920-86582396756a?w=1600&q=80)] bg-cover bg-center" /> */}
        <div className="w-full h-full absolute top-0 left-0 bg-linear-to-b from-teal-200/50 to-green-700/50" />
        <div className="absolute top-0 left-0 w-full bg-black/10 h-full" />
        <SearchBox />
      </div>
      {isEnabled && !isPending && (
        <div className="p-5">
          <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-5">
            <div className="flex justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-foreground">
                  Search Results
                </h2>
                <p className="text-muted-foreground">
                  Found {data?.result.count} for{" "}
                  <span className="font-semibold text-primary">
                    "{debouncedQuery}"
                  </span>
                </p>
              </div>
              <FilterMenu />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data?.result.items.map((producer) => (
                <PublicProducerCard
                  userIpGeo={userIpGeo}
                  key={producer.id}
                  producer={producer}
                />
              ))}
            </div>
            {(data?.result.hasMore || (data?.result.offset ?? 0) > 0) && (
              <div className="flex justify-between gap-5">
                <Button
                  variant={"brandBrown"}
                  size={"icon"}
                  onClick={() => setPage((old) => Math.max(old - 1, 0))}
                  disabled={page === 0}
                >
                  <ArrowLeft />
                </Button>
                <Badge variant={"brandBrown"}>Page {page + 1}</Badge>
                <Button
                  variant={"brandBrown"}
                  size={"icon"}
                  onClick={() => {
                    if (!isPlaceholderData && data?.result.hasMore) {
                      setPage((old) => old + 1);
                    }
                  }}
                  // Disable the Next Page button until we know a next page is available
                  disabled={isPlaceholderData || !data?.result.hasMore}
                >
                  <ArrowRight />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
