"use client";

import type { PinboardFull } from "@/backend/rpc/pinboard";
import { useUserPinboardFull, useUpdateUserPinboard } from "@/utils/pinboard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { ProducerCard } from "@/components/producer-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GridIcon, ListIcon, MapIcon } from "lucide-react";
import { PinboardMap } from "@/components/pinboard-map";
import { useThrottleCallback } from "@react-hook/throttle";
import { UpdateUserPinboardArgs } from "@/backend/validators/pinboard";
import { Button } from "@/components/ui/button";

export function PinboardPageClient(props: { pinboard: PinboardFull }) {
  const pinboard = useUserPinboardFull({ initialData: props.pinboard });

  const updatePinboard = useThrottleCallback(
    (args: UpdateUserPinboardArgs) => updatePinboardMt.mutate(args),
    1
  );

  const updatePinboardMt = useUpdateUserPinboard({
    onSuccess: async () => await pinboard.refetch(),
  });

  const emptyMessage = (
    <div className="space-y-2">
      <h1>
        It&apos;s kind of lonely in here. Why don&apos;t you start building your
        Pinboard
      </h1>
      <p className="text-sm">
        Save your favorite farms, ranches, and eateries here. You&apos;ll be
        able to view them as a grid, list, or map whenever you want.
      </p>
      <Button>
        <Link href={"/"}>Explore Farms, Ranches and Eateries </Link>
      </Button>
    </div>
  );

  return (
    <div className="p-10 h-[calc(100vh_-_100px)]">
      <div className="max-w-6xl mx-auto flex flex-col gap-10 h-full">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer hover:text-primary"
                >
                  <Link href={"/"}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer hover:text-primary"
                >
                  <Link href={"/dashboard"}>My Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pinboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <BackButton href={"/"} text="Back to Home" />
        </div>
        {pinboard.data && (
          <>
            <Tabs
              onValueChange={(e) =>
                updatePinboard({
                  viewMode: e as "grid",
                })
              }
              defaultValue={pinboard.data?.viewMode}
              className="h-full"
            >
              <TabsList>
                <TabsTrigger value="grid">
                  <GridIcon />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <ListIcon />
                </TabsTrigger>
                <TabsTrigger value="map">
                  <MapIcon />
                </TabsTrigger>
              </TabsList>
              {pinboard.data.pins.length === 0 && emptyMessage}
              <TabsContent value="grid">
                <div className="grid sm:grid-cols-2 md:grid-cols-3  lg:grid-cols-5 gap-5">
                  {pinboard.data?.pins.map((p) => (
                    <ProducerCard key={p.id} producer={p.producer} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="list">
                <div className="flex flex-col gap-5">
                  {pinboard.data?.pins.map((p) => (
                    <ProducerCard
                      mode="list"
                      key={p.id}
                      producer={p.producer}
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent
                value="map"
                className="rounded-lg overflow-hidden h-full"
              >
                <PinboardMap pinboard={pinboard.data} />
              </TabsContent>
            </Tabs>
          </>
        )}
        {!pinboard.data && emptyMessage}
      </div>
    </div>
  );
}
