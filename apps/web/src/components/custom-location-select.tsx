import { useEffect, useMemo, useState } from "react";
import { APIProvider, Map as MapComp, useMap } from "@vis.gl/react-google-maps";
import { env } from "@/env";
import { useGeolocation } from "@uidotdev/usehooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@ea/ui/dialog";
import { Button } from "@ea/ui/button";
import { CheckIcon, MapIcon, Trash2Icon } from "lucide-react";
import { useHomePageStore } from "@/stores";

export function LocationSelect({ disabled }: { disabled: boolean }) {
  const userLocation = useGeolocation();
  return (
    <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY}>
      <Comp
        disabled={disabled}
        userLocation={
          userLocation.latitude && userLocation.longitude
            ? { lat: userLocation.latitude, lng: userLocation.longitude }
            : null
        }
      />
    </APIProvider>
  );
}

function Comp({
  userLocation,
  disabled,
}: {
  userLocation: { lat: number; lng: number } | null;
  disabled: boolean;
}) {
  const { locationSearchArea, setLocationSearchArea } = useHomePageStore();

  const [open, setOpen] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<
    google.maps.LatLngBoundsLiteral | undefined
  >(locationSearchArea);
  const map = useMap();

  useEffect(() => {
    if (!map || !userLocation) return;
    const center = map.getCenter();
    if (!center) return;

    if (
      center.lat() === 36.778259 &&
      center.lng() === -119.417931 &&
      (userLocation.lat !== 36.778259 || userLocation.lng !== -119.417931)
    ) {
      map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [userLocation, map]);

  const boundsAreDifferent = useMemo(() => {
    return (
      locationSearchArea?.east !== currentBounds?.east ||
      locationSearchArea?.west !== currentBounds?.west ||
      locationSearchArea?.north !== currentBounds?.north ||
      locationSearchArea?.south !== currentBounds?.south
    );
  }, [locationSearchArea, currentBounds]);

  function select() {
    setLocationSearchArea(currentBounds);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"} className="font-normal">
          <MapIcon />
          Select
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[calc(100%-5rem)] lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Select an area</DialogTitle>
          <DialogDescription>
            Zoom in on an area you would like to search in and hit select when
            ready.
          </DialogDescription>
          <em className="text-destructive">
            {disabled && (
              <p>
                Your current query is using your location and thus selecting a
                location area manually is disabled.
              </p>
            )}
          </em>
        </DialogHeader>
        <div className="relative">
          <MapComp
            style={{
              width: "100%",
            }}
            className="aspect-video rounded-lg overflow-hidden"
            gestureHandling={"greedy"}
            defaultZoom={4}
            disableDefaultUI
            defaultCenter={{
              lat: userLocation?.lat ?? 36.778259,
              lng: userLocation?.lng ?? -119.417931,
            }}
            defaultBounds={currentBounds}
            onBoundsChanged={(e) => {
              setCurrentBounds(e.detail.bounds);
            }}
          ></MapComp>
          {disabled && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/50 rounded-lg"></div>
          )}
        </div>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button disabled={!boundsAreDifferent || disabled} onClick={select}>
              <CheckIcon />
              Select
            </Button>
          </DialogClose>
          {locationSearchArea && (
            <DialogClose asChild>
              <Button
                disabled={disabled}
                onClick={() => setLocationSearchArea(undefined)}
                variant={"destructive"}
              >
                <Trash2Icon />
                Clear
              </Button>
            </DialogClose>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
