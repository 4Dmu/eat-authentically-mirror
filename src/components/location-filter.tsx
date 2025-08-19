import { useCallback } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useHomePageStore } from "@/stores";
import { Button } from "./ui/button";
import { env } from "@/env";

export function LocationFilter() {
  return (
    <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY}>
      <Comp />
    </APIProvider>
  );
}

function Comp() {
  const { locationSearchArea, setLocationSearchArea } = useHomePageStore();

  const map = useMap();

  const handleSelectLocation = useCallback(() => {
    if (!map) {
      return;
    }

    setLocationSearchArea(map.getBounds());
  }, [map, setLocationSearchArea]);

  return (
    <div>
      <Map
        style={{ width: "100%", height: "30vh" }}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        defaultZoom={5}
        defaultCenter={{ lat: 36.778259, lng: -119.417931 }}
      />
      <div>
        <Button onClick={handleSelectLocation}>Select</Button>
        {locationSearchArea && (
          <Button onClick={() => setLocationSearchArea(undefined)}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
