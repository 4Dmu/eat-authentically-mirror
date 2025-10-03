"use client";

import type { PinboardFull } from "@/backend/rpc/pinboard";
import {
  useUserPinboardFull,
  useUpdateUserPinboard,
  useDeletePinlist,
} from "@/utils/pinboard";
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
import { GridIcon, ListIcon, MapIcon, Trash2Icon, XIcon } from "lucide-react";
import { PinboardMap } from "@/components/pinboard-map";
import { useThrottleCallback } from "@react-hook/throttle";
import { UpdateUserPinboardArgs } from "@/backend/validators/pinboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewPinlistDialog } from "@/components/pinboard-new-list-dialog";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import { showPinlistDialogAfterPinCreationAtom } from "@/stores";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function PinboardPageClient(props: { pinboard: PinboardFull }) {
  const [selectedPinlistId, setSelectedPinlistId] = useState<string>();
  const pinboard = useUserPinboardFull({ initialData: props.pinboard });

  const [
    showPinlistDialogAfterPinCreation,
    setShowPinlistDialogAfterPinCreation,
  ] = useAtom(showPinlistDialogAfterPinCreationAtom);

  const updatePinboard = useThrottleCallback(
    (args: UpdateUserPinboardArgs) => updatePinboardMt.mutate(args),
    1
  );

  const updatePinboardMt = useUpdateUserPinboard({
    onSuccess: async () => await pinboard.refetch(),
  });

  const selectedPinlist = useMemo(
    () => pinboard.data?.pinLists.find((p) => p.id === selectedPinlistId),
    [pinboard.data, selectedPinlistId]
  );

  const deletePinList = useDeletePinlist({
    onSuccess: async () => await pinboard.refetch(),
  });

  function handleDeletePinlist(pinListId: string) {
    if (selectedPinlistId === pinListId) {
      setSelectedPinlistId(undefined);
    }
    deletePinList.mutate({ pinListId });
  }

  const pins = useMemo(() => {
    const pins = pinboard.data?.pins ?? [];

    if (selectedPinlist) {
      return pins.filter((p) =>
        selectedPinlist.items.some((i) => i.pinId === p.id)
      );
    }

    return pins;
  }, [pinboard.data, selectedPinlist]);

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
    <div className="p-3 sm:p-10">
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
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 min-h-9">
                  <span>Your Pinboard</span>
                  {selectedPinlist && (
                    <>
                      <span>/</span>
                      <Button
                        onClick={() => setSelectedPinlistId(undefined)}
                        variant={"secondary"}
                      >
                        <span>{selectedPinlist.name}</span>
                        <XIcon />
                      </Button>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
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
                  {selectedPinlist && pins.length === 0 && (
                    <p>
                      This list is empty, add some pins and they will appear
                      here.
                    </p>
                  )}
                  <TabsContent value="grid">
                    <div className="max-h-[50vh] overflow-auto p-2">
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                        {pins.map((p) => (
                          <ProducerCard
                            context={
                              pinboard.data && pinboard.data.pinLists.length > 0
                                ? "pinboard"
                                : "default"
                            }
                            key={p.id}
                            producer={p.producer}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="list">
                    <div className="max-h-[50vh] overflow-auto p-2">
                      <div className="flex flex-col gap-10">
                        {pins.map((p) => (
                          <ProducerCard
                            context={
                              pinboard.data && pinboard.data.pinLists.length > 0
                                ? "pinboard"
                                : "default"
                            }
                            mode="list"
                            key={p.id}
                            producer={p.producer}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="map"
                    className="rounded-lg overflow-hidden"
                  >
                    <div className="h-[50vh]">
                      <PinboardMap pins={pins} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <Card className="pb-0 overflow-clip">
              <CardHeader className="flex gap-5 justify-between items-center">
                <div className="flex flex-col gap-2">
                  <CardTitle>Your Pin Lists</CardTitle>
                  <CardDescription>
                    Organize your pins into lists
                  </CardDescription>
                </div>
                <div className="">
                  <NewPinlistDialog />
                </div>
              </CardHeader>
              <CardContent className="bg-gray-50 p-5">
                <div className="flex flex-wrap gap-5">
                  {pinboard.data.pinLists.map((p) => (
                    <Card className="p-3 max-sm:w-full" key={p.id}>
                      <div className="flex gap-5">
                        <div className="flex gap-5 items-center justify-between w-full">
                          <div className="flex gap-2 items-center">
                            <ListIcon className="p-1 bg-gray-50 rounded-full border" />
                            <p className="text-lg font-semibold">{p.name}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant={"brandGreen"}
                              onClick={() => setSelectedPinlistId(p.id)}
                            >
                              {selectedPinlistId === p.id ? "Close" : "View"}
                            </Button>
                            <ConfirmDialog
                              title={`Delete Pinlist "${p.name}`}
                              description="Are you sure? This action cannot be undone."
                              cancelText="Cancel"
                              continueText="Delete"
                              continueVariants={{ variant: "brandRed" }}
                              continueAction={() => handleDeletePinlist(p.id)}
                              continueDisabled={deletePinList.isPending}
                            >
                              <Button size={"icon"} variant={"brandRed"}>
                                <Trash2Icon />
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
        {!pinboard.data && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your Pinboard</CardTitle>
            </CardHeader>
            <CardContent className="h-full">{emptyMessage}</CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure how you interact with your pinboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full">
            <div className="flex gap-2">
              <Label>Show the add to list dialog on pin creation?</Label>
              <Checkbox
                className="size-5"
                checked={showPinlistDialogAfterPinCreation}
                onCheckedChange={(e) =>
                  setShowPinlistDialogAfterPinCreation(e == true)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
