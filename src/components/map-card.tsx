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

export function MapCard({
  coordinate,
}: {
  coordinate: NonNullable<NonNullable<Producer["address"]>["coordinate"]>;
}) {
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
              lat: coordinate.latitude,
              lng: coordinate.longitude,
            }}
          >
            <Marker
              position={{
                lat: coordinate.latitude,
                lng: coordinate.longitude,
              }}
            />
          </Map>
        </APIProvider>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${coordinate.latitude},${coordinate.longitude}`}
          >
            Open Maps
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
