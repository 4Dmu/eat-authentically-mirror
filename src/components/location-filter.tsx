import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useHomePageStore } from "@/stores";
import { Button } from "./ui/button";
import { env } from "@/env";
import { useGeolocation } from "@uidotdev/usehooks";
import { Rectangle } from "./maps/square";

export function LocationFilter() {
  const location = useGeolocation();
  if (location.loading) {
    return;
  }
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
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const { locationSearchArea, setLocationSearchArea } = useHomePageStore();

  const map = useMap();
  const coreLibrary = useMapsLibrary("core");

  const disableSelect = useMemo(() => {
    if (!bounds || !locationSearchArea) {
      return false;
    }
    return bounds.equals(locationSearchArea);
  }, [bounds, locationSearchArea]);

  const handleSelectLocation = useCallback(() => {
    console.log(map?.getBounds()?.toJSON());
    setLocationSearchArea(bounds ?? undefined);
  }, [bounds]);

  useEffect(() => {
    if (!coreLibrary || !map) return;

    setBounds(
      new coreLibrary.LatLngBounds(
        location
          ? getBoundsFromCenter(location.lat, location.lng)
          : {
              south: 32.45823411743235,
              west: -125.44785728400825,
              north: 41.13266168275932,
              east: -110.37461509650825,
            },
      ),
    );
  }, [map, coreLibrary]);

  const changeBounds = (newBounds: google.maps.LatLngBounds | null) => {
    setBounds(newBounds);
  };

  return (
    <div className="space-y-4">
      <div></div>
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
        {location && (
          <Marker
            position={{
              lat: location.lat,
              lng: location.lng,
            }}
          />
        )}
        {bounds && (
          <Rectangle
            bounds={bounds}
            onBoundsChanged={changeBounds}
            strokeColor={"#0c4cb3"}
            strokeOpacity={1}
            strokeWeight={3}
            fillColor={"#3b82f6"}
            fillOpacity={0.3}
            editable
            draggable
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

function getBoundsFromCenter(lat: number, lng: number, zoom = 5) {
  // Approximate spans for zoom level 5
  const latSpan = 180 / Math.pow(2, zoom); // ≈ 5.625
  const lngSpan = 360 / Math.pow(2, zoom); // ≈ 11.25

  const south = lat - latSpan / 2;
  const north = lat + latSpan / 2;
  const west = lng - lngSpan / 2;
  const east = lng + lngSpan / 2;

  return { south, north, west, east };
}
