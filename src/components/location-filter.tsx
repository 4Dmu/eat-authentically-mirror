import { useCallback, useEffect, useMemo, useState } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useHomePageStore } from "@/stores";
import { Button } from "./ui/button";
import { env } from "@/env";
import { useGeolocation } from "@uidotdev/usehooks";

export function LocationFilter() {
  const location = useGeolocation();
  return (
    <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY}>
      <Comp
        location={
          location.latitude && location.longitude
            ? { lat: location.latitude, lng: location.longitude }
            : null
        }
      />
    </APIProvider>
  );
}

function Comp({ location }: { location: { lat: number; lng: number } | null }) {
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | undefined>(
    undefined,
  );
  const { locationSearchArea, setLocationSearchArea } = useHomePageStore();

  const map = useMap();

  const disableSelect = useMemo(() => {
    if (!bounds || !locationSearchArea) {
      return false;
    }
    return bounds.equals(locationSearchArea);
  }, [bounds, locationSearchArea]);

  const handleSelectLocation = useCallback(() => {
    setLocationSearchArea(bounds ?? undefined);
  }, [bounds, setLocationSearchArea]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const free = map.addListener("bounds_changed", () => {
      setBounds(map.getBounds());
    });

    return () => {
      free.remove();
    };
  }, [map]);

  useEffect(() => {
    console.log(map, location, "rn");
    if (!map || !location) return;
    const center = map.getCenter();
    if (!center) return;

    if (
      center.lat() == 36.778259 &&
      center.lng() == -119.417931 &&
      (location.lat !== 36.778259 || location.lng !== -119.417931)
    ) {
      map.setCenter({ lat: location.lat, lng: location.lng });
    }
  }, [location, map]);

  return (
    <div className="space-y-4">
      <div>
        Filter producers to ones located within this maps bounds (It will
        automatically center at your location if allowed)
      </div>
      <Map
        style={{ width: "100%", height: "40vh" }}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        defaultZoom={4}
        defaultCenter={{
          lat: location?.lat ?? 36.778259,
          lng: location?.lng ?? -119.417931,
        }}
      >
        {location && map && (
          <Marker
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285F4", // Google Maps blue
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "white",
            }}
            position={{
              lat: location.lat,
              lng: location.lng,
            }}
          />
        )}
      </Map>
      <div className="flex gap-2">
        <Button disabled={disableSelect} onClick={handleSelectLocation}>
          Select
        </Button>
        {locationSearchArea && (
          <Button onClick={() => setLocationSearchArea(undefined)}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
