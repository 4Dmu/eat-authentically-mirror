import { PinboardFull } from "@/backend/rpc/pinboard";
import { ImageData } from "@/backend/validators/producers";
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
  pinboard: PinboardFull;
};

type PinsWithAddress = {
  producer: {
    address: {
      coordinate: {
        latitude: number;
        longitude: number;
      };
      street?: string | undefined;
      city?: string | undefined;
      state?: string | undefined;
      country?: string | undefined;
      zip?: string | undefined;
    };
    id: string;
    name: string;
    claimed: boolean;
    images: {
      primaryImgId: string | null;
      items: ImageData[];
    };
  };
  id: string;
  createdAt: Date;
  producerId: string;
  pinboardId: string;
};

export function PinboardMap({ pinboard }: PinboardMapProps) {
  const pinsWithAddresses = useMemo(() => {
    return pinboard.pins
      .filter((p) => p.producer.address?.coordinate !== undefined)
      .map((p) => ({
        ...p,
        producer: {
          ...p.producer,
          address: {
            ...p.producer.address,
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            coordinate: p.producer.address?.coordinate!,
          },
        },
      }));
  }, [pinboard.pins]);

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
  const defaultCenter = pinsWithAddresses[0].producer.address.coordinate;
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  return (
    <Map
      style={{ width: "100%", height: "100%" }}
      gestureHandling={"greedy"}
      disableDefaultUI={true}
      defaultZoom={4}
      defaultCenter={{
        lat: defaultCenter.latitude ?? 36.778259,
        lng: defaultCenter.longitude ?? -119.417931,
      }}
    >
      {pinsWithAddresses.map((p) => (
        <div key={p.id}>
          <Marker
            position={{
              lat: p.producer.address.coordinate.latitude,
              lng: p.producer.address.coordinate.longitude,
            }}
            onClick={() => setActivePlaceId(p.id)}
          />
          {activePlaceId === p.id && (
            <InfoWindow
              headerContent={<h3 className="font-bold">{p.producer.name}</h3>}
              position={{
                lat: p.producer.address.coordinate.latitude,
                lng: p.producer.address.coordinate.longitude,
              }}
              onCloseClick={() => setActivePlaceId(null)}
            >
              <div className="space-y-2">
                <div>
                  {p.producer.address.street &&
                    `${p.producer.address.street}, `}
                  {p.producer.address.city && `${p.producer.address.city}, `}
                  {p.producer.address.state && `${p.producer.address.state}, `}
                  {p.producer.address.zip && `${p.producer.address.zip}, `}
                  {p.producer.address.country &&
                    countryByAlpha3Code(p.producer.address.country).name}
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
