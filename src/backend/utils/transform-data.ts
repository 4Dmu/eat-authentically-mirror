import type * as schema from "../db/schema";

export function withCertifications<
  T extends {
    certificationsToListings: {
      certification: typeof schema.certifications.$inferSelect;
    }[];
  }
>(data: T[]) {
  return data.map(({ certificationsToListings, ...l }) => ({
    ...l,
    certifications: certificationsToListings.map((cl) => cl.certification),
  }));
}

export function withCertificationsSingle<
  T extends {
    certificationsToListings: {
      certification: typeof schema.certifications.$inferSelect;
    }[];
  }
>({ certificationsToListings, ...rest }: T) {
  return {
    ...rest,
    certifications: certificationsToListings.map((cl) => cl.certification),
  };
}
