"use client";
import { env } from "@/env";
import {
  APIProvider,
  Map as GoogleMapsComp,
  Marker,
} from "@vis.gl/react-google-maps";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ea/ui/card";
import { Button } from "@ea/ui/button";
import type {
  ProducerLocationSelect,
  ProducersGoogleMapsPlaceDetailsSelect,
} from "@ea/db/schema";

export function MapCard({
  location,
  maps,
}: {
  location: ProducerLocationSelect;
  maps: ProducersGoogleMapsPlaceDetailsSelect | null;
}) {
  if (!location.latitude || !location.longitude) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map</CardTitle>
      </CardHeader>
      <CardContent>
        <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY}>
          <GoogleMapsComp
            style={{
              width: "100%",
              height: "20vh",
              borderRadius: "20px",
              overflow: "hidden",
            }}
            gestureHandling={"greedy"}
            disableDefaultUI={true}
            defaultZoom={7}
            minZoom={3}
            defaultCenter={{
              lat: location.latitude,
              lng: location.longitude,
            }}
          >
            <Marker
              position={{
                lat: location.latitude,
                lng: location.longitude,
              }}
            />
          </GoogleMapsComp>
        </APIProvider>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a
            target="_blank"
            href={
              maps?.mapsUri ??
              `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
            }
          >
            Open Maps
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
