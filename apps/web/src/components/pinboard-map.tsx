import { PinboardFull } from "@/backend/rpc/pinboard";
import { env } from "@/env";
import { countryByAlpha3Code } from "@/utils/contries";
import { producerSlugFull } from "@/utils/producers";
import {
  APIProvider,
  InfoWindow,
  Map,
  Marker,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useMemo, useState } from "react";

export type PinboardMapProps = {
  pins: PinboardFull["pins"];
};

type PinsWithAddress = {
  producer: {
    id: string;
    location: {
      latitude: number;
      longitude: number;
      city?: string | null | undefined;
      country?: string | null | undefined;
      producerId?: string | undefined;
      geoId?: number | undefined;
      locality?: string | null | undefined;
      postcode?: string | null | undefined;
      adminArea?: string | null | undefined;
      geohash?: string | null | undefined;
    };
    name: string;
  };
  id: string;
  createdAt: Date;
  producerId: string;
  pinboardId: string;
};

export function PinboardMap({ pins }: PinboardMapProps) {
  const pinsWithAddresses = useMemo(() => {
    return pins
      .filter(
        (p) => p.producer.location?.latitude && p.producer.location.longitude
      )
      .map((p) => ({
        ...p,
        producer: {
          ...p.producer,
          location: {
            ...p.producer.location,
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            latitude: p.producer.location?.latitude!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            longitude: p.producer.location?.longitude!,
          },
        },
      }));
  }, [pins]);

  if (pinsWithAddresses.length === 0) {
    return (
      <div>
        If any of your pins have an address set you will be able to see them on
        a map here.
      </div>
    );
  }

  return (
    <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY}>
      <PinboardMapInner pinsWithAddresses={pinsWithAddresses} />
    </APIProvider>
  );
}

function PinboardMapInner({
  pinsWithAddresses,
}: {
  pinsWithAddresses: PinsWithAddress[];
}) {
  const defaultCenter:
    | {
        latitude: number;
        longitude: number;
      }
    | undefined = pinsWithAddresses[0]?.producer?.location;
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  return (
    <Map
      style={{ width: "100%", height: "100%" }}
      gestureHandling={"greedy"}
      disableDefaultUI={true}
      defaultZoom={4}
      defaultCenter={{
        lat: defaultCenter?.latitude ?? 36.778259,
        lng: defaultCenter?.longitude ?? -119.417931,
      }}
    >
      {pinsWithAddresses.map((p) => (
        <div key={p.id}>
          <Marker
            position={{
              lat: p.producer.location.latitude,
              lng: p.producer.location.longitude,
            }}
            onClick={() => setActivePlaceId(p.id)}
          />
          {activePlaceId === p.id && (
            <InfoWindow
              headerContent={<h3 className="font-bold">{p.producer.name}</h3>}
              position={{
                lat: p.producer.location.latitude,
                lng: p.producer.location.longitude,
              }}
              onCloseClick={() => setActivePlaceId(null)}
            >
              <div className="space-y-2">
                <div>
                  {p.producer.location.locality &&
                    `${p.producer.location.locality}, `}
                  {p.producer.location.city && `${p.producer.location.city}, `}
                  {p.producer.location.adminArea &&
                    `${p.producer.location.adminArea}, `}
                  {p.producer.location.postcode &&
                    `${p.producer.location.postcode}, `}
                  {p.producer.location.country &&
                    countryByAlpha3Code(p.producer.location.country)?.name}
                </div>
                <Link
                  className="underline text-brand-green font-bold"
                  href={`/producers/${producerSlugFull(p.producer)}`}
                >
                  View Producer
                </Link>
              </div>
            </InfoWindow>
          )}
        </div>
      ))}
    </Map>
  );
}
