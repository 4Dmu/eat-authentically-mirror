"use client";

import type { Geo } from "@vercel/functions";
import { FilterMenu } from "@/components/filter-menu";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@ea/ui/badge";
import { Button } from "@ea/ui/button";
import { useGeolocationStore, useHomePageStore } from "@/stores";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import { HOME_PAGE_RESULT_LIMIT } from "@ea/shared/constants";
import { useSearchProducersLocal } from "@/utils/producers";
import { RequestLocation } from "@/components/request-location";
import { PublicProducerCard } from "@/components/public-producer-card";
import { RadiusSelector } from "@/components/radius-selector";
import { useRef } from "react";

export function Page({ userIpGeo }: { userIpGeo: Geo | undefined }) {
  const ipGeo =
    userIpGeo?.latitude && userIpGeo.longitude
      ? { lat: Number(userIpGeo.latitude), lon: Number(userIpGeo.longitude) }
      : undefined;
  const {
    categoryFilter: typeFilter,
    query,
    certsFilter: certs,
    page,
    setPage,
    customUserLocationRadius,
    countryFilter: country,
    locationSearchArea,
  } = useHomePageStore();

  const debouncedQuery = useDebounce(query, 500);
  const debouncedCustomUserLocationRadius = useDebounce(
    customUserLocationRadius,
    500
  );
  const titleRef = useRef<HTMLDivElement>(null);

  const userLocation = useGeolocationStore((s) => s.state);

  const searchQuery = useSearchProducersLocal(
    {
      query: debouncedQuery,
    },
    { page },
    {
      position: userLocation?.position,
      radius: debouncedCustomUserLocationRadius?.[0],
    },
    { bounds: locationSearchArea },
    {
      country: country,
      category: typeFilter,
      certifications: certs.length === 0 ? undefined : certs.map((c) => c.name),
    },
    ipGeo
  );

  // const searchQuery = useSearchProducersLocal2(
  //   {
  //     query: debouncedQuery,
  //   },
  //   { page },
  //   {
  //     position: userLocation?.position,
  //     radius: debouncedCustomUserLocationRadius?.[0],
  //   },
  //   {
  //     country: country,
  //     category: typeFilter,
  //     certifications: certs.map((c) => c.name),
  //   },
  //   ipGeo
  // );

  const hasMore =
    searchQuery.data &&
    searchQuery.data.result.page * HOME_PAGE_RESULT_LIMIT <
      searchQuery.data.result.found;

  const pagination = (hasMore || (searchQuery.data?.result.page ?? 0) > 0) && (
    <div className="flex justify-between gap-5">
      <Button
        variant={"brandBrown"}
        size={"icon"}
        onClick={() => {
          setPage((old) => Math.max(old - 1, 0));
          titleRef.current?.scrollIntoView();
        }}
        disabled={page === 1}
      >
        <ArrowLeft />
      </Button>
      <Badge variant={"brandBrown"}>
        Page {page} of{" "}
        {Math.ceil(
          (searchQuery.data?.result.found ?? 1) / HOME_PAGE_RESULT_LIMIT
        )}
      </Badge>
      <Button
        variant={"brandBrown"}
        size={"icon"}
        onClick={() => {
          if (!searchQuery.isPlaceholderData && hasMore) {
            setPage((old) => old + 1);
            titleRef.current?.scrollIntoView();
          }
        }}
        // Disable the Next Page button until we know a next page is available
        disabled={searchQuery.isPlaceholderData || !hasMore}
      >
        <ArrowRight />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-10  bg-gray-50">
      <RequestLocation />
      <div className="h-[65vh] min-h-[550px] w-full relative">
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/FRF_Home.jpg)] animate-[fade1_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/FRF_Eaterie_Default.jpg)] animate-[fade2_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/FRF_Ranch_Default.jpg)] animate-[fade3_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/Ranch_Default2.jpg)] animate-[fade4_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/tomatoesontable.jpg)] animate-[fade5_150s_infinite]" />
        <div className="w-full h-full absolute top-0 left-0 bg-linear-to-b from-teal-200/50 to-green-700/50" />
        <div className="absolute top-0 left-0 w-full bg-black/10 h-full" />
        <SearchBox
          userRequestsUsingTheirLocation={
            searchQuery.data?.userLocation.userRequestsUsingTheirLocation
          }
          isSearching={searchQuery.fetchStatus === "fetching"}
        >
          {searchQuery.data?.userLocation.userRequestsUsingTheirLocation &&
            searchQuery.isEnabled && (
              <RadiusSelector
                defaultRadius={searchQuery.data.userLocation.searchRadius}
              />
            )}
        </SearchBox>
      </div>
      {searchQuery.isEnabled && !searchQuery.isPending && (
        <div className="p-5" ref={titleRef}>
          <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-5">
            <div className="flex justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-foreground">
                  Search Results
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery.data?.result.found} results found - Searched{" "}
                  {searchQuery.data?.result.out_of}
                  {/* <span className="font-semibold text-primary">
                    &quot;{debouncedQuery}&quot;
                  </span>
                  {(searchQuery.data?.userLocation
                    .userRequestsUsingTheirLocation ||
                    certs.length > 0 ||
                    typeFilter ||
                    country) && (
                    <>
                      <span> where</span>
                      {typeFilter && <span> category is {typeFilter}</span>}
                      {searchQuery.data?.userLocation
                        .userRequestsUsingTheirLocation && (
                        <span>
                          {" "}
                          {typeFilter ? "and " : ""}
                          in a {searchQuery.data.userLocation.searchRadius} km
                          radius{" "}
                        </span>
                      )}
                      {certs && certs.length > 0 && (
                        <>
                          <span>
                            {" "}
                            {searchQuery.data?.userLocation
                              .userRequestsUsingTheirLocation || typeFilter
                              ? "and "
                              : ""}
                            has certifications{" "}
                            {certs.map((c) => `"${c.name}"`).join(",")}
                          </span>
                        </>
                      )}
                      {country && (
                        <span>
                          {" "}
                          {searchQuery.data?.userLocation
                            .userRequestsUsingTheirLocation ||
                          typeFilter ||
                          (certs && certs.length)
                            ? "and "
                            : ""}
                          in{" "}
                          {match(countryByAlpha3Code(country))
                            .with(P.nullish, () => "")
                            .otherwise((v) => v.aliases?.[0] ?? v.name)}
                        </span>
                      )}
                    </>
                  )} */}
                </p>
              </div>
              <FilterMenu />
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {searchQuery.data?.result?.hits?.map((row) => (
                <PublicProducerCard
                  userIpGeo={userIpGeo}
                  key={row.document.id}
                  producer={row.document}
                />
              ))}
            </div>
            {pagination}
          </div>
        </div>
      )}
    </div>
  );
}
