import type * as schema from "../db/schema";

export function withCertifications<
  T extends {
    certificationsToProducers: {
      certification: typeof schema.certifications.$inferSelect;
    }[];
  },
>(data: T[]) {
  return data.map(({ certificationsToProducers, ...l }) => ({
    ...l,
    certifications: certificationsToProducers.map((cl) => cl.certification),
  }));
}

export function withMapsUrl<
  T extends {
    googleMapsPlaceDetails: schema.GoogleMapsPlaceDetails | null;
  },
>(
  value: T[]
): (Omit<T, "googleMapsPlaceDetails"> & {
  googleMapsUrl: string | undefined;
})[] {
  return value.map(({ googleMapsPlaceDetails, ...rest }) => ({
    ...rest,
    googleMapsUrl: googleMapsPlaceDetails?.googleMapsUri,
  }));
}

export function withCertificationsSingle<
  T extends {
    certificationsToProducers: {
      certification: typeof schema.certifications.$inferSelect;
    }[];
  },
>({ certificationsToProducers, ...rest }: T) {
  return {
    ...rest,
    certifications: certificationsToProducers.map((cl) => cl.certification),
  };
}
