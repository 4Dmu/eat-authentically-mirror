"use client";
import { Producer } from "@/backend/validators/producers";
import { env } from "@/env";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  ProducerLocationSelect,
  ProducersGoogleMapsPlaceDetailsSelect,
} from "@/backend/db/schema";

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
          <Map
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
          </Map>
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
