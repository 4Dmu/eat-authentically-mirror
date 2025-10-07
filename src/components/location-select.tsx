import { useCallback, useEffect, useMemo, useState } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useHomePageStore } from "@/stores";
import { Button } from "./ui/button";
import { env } from "@/env";
import { useGeolocation } from "@uidotdev/usehooks";

export function LocationSelect() {
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
  const [selected, setSelected] = useState<google.maps.LatLngLiteral | null>(
    null
  );

  const map = useMap();

  useEffect(() => {
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
      <Map
        style={{ width: "100%", height: "30vh" }}
        gestureHandling={"greedy"}
        defaultZoom={4}
        onClick={(e) => {
          // new google.maps.marker.AdvancedMarkerElement({
          //   map: e.map,
          //   position: e.detail.latLng,
          // });
          setSelected(e.detail.latLng);
        }}
        defaultCenter={{
          lat: location?.lat ?? 36.778259,
          lng: location?.lng ?? -119.417931,
        }}
      >
        {map && selected && <Marker position={selected} />}
      </Map>
      <div className="flex gap-2">
        {/* {locationSearchArea && (
          <Button onClick={() => setLocationSearchArea(undefined)}>
            Clear
          </Button>
        )} */}
      </div>
    </div>
  );
}
