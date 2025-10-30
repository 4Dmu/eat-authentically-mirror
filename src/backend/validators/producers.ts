import { type } from "arktype";
import { alpha3CountryCodeValidator } from "./country";
import { ClaimRequestStatus } from "../db/schema";
import { isMobilePhone } from "validator";
import {
  mediaAssetSelectValidator,
  producerCertificationsSelectValidator,
  producerCommoditiesSelectValidator,
  producerContactSelectValidator,
  producerInsertValidator,
  producerLocationInsertValidator,
  producerLocationSelectValidator,
  producerMediaSelectValidator,
  producerSelectValidator,
  producerSocialSelectValidator,
} from "../db/contracts";

export const PRODUCER_TYPES = [
  "farm",
  "ranch",
  "eatery",
] as const satisfies ProducerTypes[];

export const PRODUCER_CLAIM_METHODS = [
  "contact-email-link",
  "domain-email-link",
  "domain-dns",
  "contact-phone-link",
  "social-post",
  "manual",
] as const satisfies ProducerClaimVerificationMethods[];

export const producerTypesValidator = type("'farm'|'ranch'|'eatery'");

export const producerClaimContactEmailLinkMethod = type("'contact-email-link'");
export const producerClaimDomainEmailLinkMethod = type("'domain-email-link'");
export const producerClaimDomainDNSLinkMethod = type("'domain-dns'");
export const producerClaimContactPhoneLinkMethod = type("'contact-phone-link'");
export const producerClaimSocialPostMethod = type("'social-post'");
export const producerClaimManualMethod = type("'manual'");

export const producerClaimVerificationMethods =
  producerClaimContactEmailLinkMethod
    .or(producerClaimDomainEmailLinkMethod)
    .or(producerClaimDomainDNSLinkMethod)
    .or(producerClaimContactPhoneLinkMethod)
    .or(producerClaimSocialPostMethod)
    .or(producerClaimManualMethod);

export const claimProducerVerification = type({
  method: producerClaimContactEmailLinkMethod,
  producerContactEmail: "string.email",
})
  .or(
    type({
      method: producerClaimContactPhoneLinkMethod,
      producerContactPhone: "string",
    })
  )
  .or(
    type({
      method: producerClaimDomainDNSLinkMethod,
      domain: "string",
    })
  )
  .or(
    type({
      method: producerClaimManualMethod,
      claimerEmail: "string.email",
    })
  )
  .or(
    type({
      method: producerClaimDomainEmailLinkMethod,
      domainDomainEmailPart: "string",
      domain: "string",
    })
  )
  .or(
    type({
      method: producerClaimSocialPostMethod,
      socialHandle: "string",
    })
  );

export const claimProducerVerificationClient = type({
  method: producerClaimContactEmailLinkMethod,
})
  .or(
    type({
      method: producerClaimContactPhoneLinkMethod,
    })
  )
  .or(
    type({
      method: producerClaimDomainDNSLinkMethod,
    })
  )
  .or(
    type({
      method: producerClaimManualMethod,
      claimerEmail: "string.email",
    })
  )
  .or(
    type({
      method: producerClaimDomainEmailLinkMethod,
      domainDomainEmailPart: "string",
    })
  )
  .or(
    type({
      method: producerClaimSocialPostMethod,
      socialHandle: "string",
    })
  );

export const contactValidator = type({
  "email?": "string.email|null",
  "phone?": "string|null",
  "website?": "string.url|null",
});

export const addressValidator = type({
  "street?": "string|undefined",
  "city?": type("string|undefined"),
  "state?": "string|undefined",
  "country?": alpha3CountryCodeValidator.or(type.undefined),
  "zip?": "string|undefined",
  "coordinate?": type({
    latitude: "number",
    longitude: "number",
  }).or(type.undefined),
});

export const suggestProducerArgs = type({
  name: type("string").atLeastLength(3).atMostLength(300).configure({
    expected: "",
    message: "Name must be between 3 and 300 characters",
  }),
  type: producerTypesValidator.configure({
    expected: "",
    message: "Type must be farm, ranch or eatery",
  }),
  address: type({
    street: type("string").atLeastLength(1),
    city: type("string").atLeastLength(1),
    state: type("string").atLeastLength(1),
    country: alpha3CountryCodeValidator,
    zip: type("string.numeric").atLeastLength(2),
  }),
  "email?": "string.email|undefined",
  "phone?": type("string|undefined").narrow((v, ctx) =>
    v === undefined
      ? true
      : isMobilePhone(v)
        ? true
        : ctx.mustBe("a valid phone number")
  ),
}).narrow((args, ctx) => {
  if (args.email === undefined && args.phone === undefined) {
    ctx.reject({
      expected: "a valid email or phone or both",
      actual: "",
      path: ["email"],
    });

    ctx.reject({
      expected: "a valid email or phone or both",
      actual: "",
      path: ["phone"],
    });

    return false;
  }
  return true;
});

export const certificationValidator = type({
  name: "string",
  isVerified: "boolean",
  id: "string",
  createdAt: "Date",
  updatedAt: "Date",
});

export const imageDataValidator = type({
  _type: "'cloudflare'",
  cloudflareId: "string",
  cloudflareUrl: "string.url",
  alt: "string",
});

export const businessHoursValidator = type({});

export const socialMediaValidator = type({
  twitter: "string.url|null",
  facebook: "string.url|null",
  instagram: "string.url|null",
});

export const videoValidator = type({
  url: "string",
  _type: "'cloudflare'",
  uid: "string",
  status: "'ready'|'pending'",
});

export const editProducerFormValidator = producerSelectValidator
  .pick("name", "about", "type")
  .and({
    media: producerMediaSelectValidator
      .and({
        asset: mediaAssetSelectValidator,
      })
      .array(),
    contact: producerContactSelectValidator.omit("producerId").or(type.null),
    social: producerSocialSelectValidator.omit("producerId").or(type.null),
    location: producerLocationSelectValidator
      .omit("geoId", "geohash", "producerId")
      .or(type.null),
    commodities: producerCommoditiesSelectValidator.array(),
    certifications: producerCertificationsSelectValidator.array(),
  });

export const producerFormBasicValidator = type({
  name: "string",
  type: producerTypesValidator,
  about: "string|null",
});

export const ipGeoValidator = type({
  /** The city that the request originated from. */
  "city?": "string",
  /** The country that the request originated from. */
  "country?": "string",
  /** The flag emoji for the country the request originated from. */
  "flag?": "string",
  /** The [Vercel Edge Network region](https://vercel.com/docs/concepts/edge-network/regions) that received the request. */
  "region?": "string",
  /** The region part of the ISO 3166-2 code of the client IP.
   * See [docs](https://vercel.com/docs/concepts/edge-network/headers#x-vercel-ip-country-region).
   */
  "countryRegion?": "string",
  /** The latitude of the client. */
  "latitude?": "string.numeric.parse",
  /** The longitude of the client. */
  "longitude?": "string.numeric.parse",
  /** The postal code of the client */
  "postalCode?": "string",
});

// export const listProducersArgsValidator = type({
//   "type?": producerTypesValidator,
//   page: "number",
//   "query?": "string",
//   certs: type("string").array(),
//   "locationSearchArea?": LatLangBoundsLiteralValidator,
//   "claimed?": "boolean",
//   "userIpGeo?": ipGeoValidator,
// });

const queryFilters = type({
  category: type.enumerated(...PRODUCER_TYPES).optional(),
  commodities: type.string.atLeastLength(1).array().optional(),
  variants: type.string.atLeastLength(1).array().optional(),
  certifications: type.string.atLeastLength(1).array().optional(),
  organicOnly: type.boolean.optional(),
  verified: type.boolean.optional(),
  isClaimed: type.boolean.optional(),
  locality: type.string.optional(),
  adminArea: type.string.optional(),
  subscriptionRankMin: type.number.optional(),
  subscriptionRankMax: type.number.optional(),
  minAvgRating: type.number.optional(),
  minBayesAvg: type.number.optional(),
  minReviews: type.number.optional(),
  hasCover: type.boolean.optional(),
  ids: type.string.array().optional(),
  excludeIds: type.string.array().optional(),
}).partial();

const searchByGeoTextQuery = type({
  "q?": type("string")
    .atLeastLength(1)
    .atMostLength(255)
    .pipe((v) => v.trim()),
  "geo?": type({
    center: type({ lat: "number", lon: "number" }),
  }).and(
    type({ radiusKm: type.number.atLeast(0.1).atMost(1000) }).or(
      type({
        bbox: type({
          minLat: "number",
          maxLat: "number",
          minLon: "number",
          maxLon: "number",
        }),
      })
    )
  ),
  "countryHint?": "string",
  "stateProvinceHint?": "string",
  "filters?": queryFilters,
});

const searchByGeoTextQueryArgs = searchByGeoTextQuery.and(
  type({
    limit: type.number.atLeast(1).atMost(50),
    offset: type.number.atLeast(0),
    "paginationId?": "string",
  })
);

export const searchByGeoTextArgsValidator = searchByGeoTextQueryArgs;

export type SearchByGeoTextArgs = typeof searchByGeoTextArgsValidator.infer;

export type SearchByGeoTextQueryArgs = typeof searchByGeoTextQuery.infer;

export type QueryFilters = typeof queryFilters.inferIn;

export const geocodePlaceInput = type({
  place: type.string.atLeastLength(2).atMostLength(300).configure({
    description: "Partial or complete address or placename to be geocoded",
  }),
});

export const listProducersArgsValidator = type({
  limit: "number",
  offset: "number",
  "query?": "string",
});

export type ListProducersArgs = typeof listProducersArgsValidator.infer;

export const getProducersArgsValidator = type({ id: "string.uuid" });

export const editProducerArgsValidator = type({
  producerId: type("string"),
  "name?": "string",
  "type?": producerTypesValidator,
  "about?": "string|null",
  contact: editProducerFormValidator.get("contact").optional(),
  location: editProducerFormValidator.get("location").optional(),
  certifications: type.string.array().optional(),
  commodities: type.number.array().optional(),
  social: editProducerFormValidator.get("social").optional(),
});

export const registerProducerArgsValidator = type({
  name: "string >= 3",
  type: producerTypesValidator,
  about: "string >= 20",
});

export const claimProducerArgs = type({
  producerId: "string",
  verification: claimProducerVerificationClient,
});

export const checkClaimDomainDnsArgs = type({ claimRequestId: "string" });

export const deleteProducerArgs = type({ producerId: "string.uuid" });

export const verifyClaimPhoneArgs = type({
  claimRequestId: "string.uuid",
  code: type("string.numeric").exactlyLength(6),
});

export const editProducerLocationFormValidator =
  producerLocationInsertValidator.omit("producerId", "geoId", "geohash");

export const editProducerArgsValidatorV2 = type({
  id: producerInsertValidator.get("id"),
  "name?": producerInsertValidator.get("name"),
  "type?": producerInsertValidator.get("type"),
  "about?": producerInsertValidator.get("about"),
  "summary?": producerInsertValidator.get("summary"),
});

export const editProducerContactArgsValidator = type({
  producerId: "string",
}).and(producerContactSelectValidator.partial());

export const editProducerLocationArgsValidator = type({
  producerId: "string",
}).and(producerLocationInsertValidator.omit("producerId", "geoId", "geohash"));

export const editProducerCertificationsArgsValidator = type({
  producerId: "string",
  certifications: "string[]",
});

export const editProducerCommodotiesArgsValidator = type({
  producerId: "string",
  commodities: "number[]",
});

export const addCommodityAndAssociateArgsValidator = type({
  producerId: "string",
  name: "string",
});

export const searchProducersArgsValidator = type({
  query: "string",
  limit: "number",
  offset: "number",
  "userLocation?": type({
    coords: type({
      accuracy: "number",
      altitude: "number|null",
      altitudeAccuracy: "number|null",
      heading: "number|null",
      latitude: "number",
      longitude: "number",
      speed: "number|null",
    }),
  }).or(type.undefined),
  "customUserLocationRadius?": "number | undefined",
  "customFilterOverrides?": type({
    "country?": "string|undefined",
    "category?": producerTypesValidator.or(type.undefined),
    "certifications?": type.string.array().or(type.undefined),
  }).or(type.undefined),
});

export const editProducerFormValidatorV2 =
  editProducerArgsValidatorV2.omit("id");

export const editProducerMediaFormValidator = type({
  media: producerMediaSelectValidator
    .and({ asset: mediaAssetSelectValidator })
    .or(
      type({
        file: "File",
        position: "number",
        id: "string",
      })
    )
    .array(),
});

export const editProucerVideoFormValidator = type({
  video: producerMediaSelectValidator
    .and({ role: "'video'" })
    .and({ asset: mediaAssetSelectValidator })
    .or(
      type({
        file: "File",
        position: "number",
        id: "string",
      })
    )
    .or(type.null),
});

export const editProducerCertificationsFormValidator = type({
  certifications: producerCertificationsSelectValidator.array(),
});

export const editProducerCommoditiesFormValidator = type({
  commodities: producerCommoditiesSelectValidator
    .or(type({ name: "string" }))
    .array(),
});

export const editProducerContactFormValditator = type({
  "email?": producerContactSelectValidator.get("email"),
  "phone?": producerContactSelectValidator.get("phone"),
  "websiteUrl?": producerContactSelectValidator.get("websiteUrl"),
});

export const regenerateClaimPhoneTokenArgs = type({ claimRequestId: "string" });

export type VerifyClaimPhoneArgs = typeof verifyClaimPhoneArgs.infer;

export type RegenerateClaimPhoneTokenArgs =
  typeof regenerateClaimPhoneTokenArgs.infer;

export type GetProducerArgs = typeof getProducersArgsValidator.infer;

export type RegisterProducerArgs = typeof registerProducerArgsValidator.infer;

export type ProducerTypes = typeof producerTypesValidator.infer;

export type SocialMedia = typeof socialMediaValidator.infer;

export type Contact = typeof contactValidator.infer;

export type Address = typeof addressValidator.infer;

export type ImageData = typeof imageDataValidator.infer;

export type Certification = typeof certificationValidator.infer;

export type EditProducerArgs = typeof editProducerArgsValidator.infer;

export type EditProducerArgsV2 = typeof editProducerArgsValidatorV2.infer;

export type EditProducerContact = typeof editProducerContactArgsValidator.infer;

export type EditProducerLocationArgs =
  typeof editProducerLocationArgsValidator.infer;

export type EditProducerCertifications =
  typeof editProducerCertificationsArgsValidator.infer;

export type EditProducerCommodoties =
  typeof editProducerCommodotiesArgsValidator.infer;

export type AddCommodityAndAssociate =
  typeof addCommodityAndAssociateArgsValidator.infer;

export type ProducerClaimVerificationMethods =
  typeof producerClaimVerificationMethods.infer;

export type ClaimProducerVerification = typeof claimProducerVerification.infer;

export type ClaimProducerArgs = typeof claimProducerArgs.infer;

export type CheckClaimDomainDnsArgs = typeof checkClaimDomainDnsArgs.infer;

export type ClaimProducerVerificationInternal =
  | {
      method: "contact-email-link";
      producerContactEmail: string;
    }
  | {
      method: "contact-phone-link";
      producerContactPhone: string;
      tokenExpiresAt: Date;
    }
  | {
      method: "domain-dns";
      domain: string;
    }
  | {
      method: "manual";
      claimerEmail: string;
    }
  | {
      method: "domain-email-link";
      domainDomainEmailPart: string;
      domain: string;
    }
  | {
      method: "social-post";
      socialHandle: string;
    };

export type PublicClaimRequest = {
  id: string;
  userId: string;
  producer: {
    id: string;
    name: string;
  };
  producerId: string;
  status: ClaimRequestStatus;
  requestedVerification:
    | {
        method: "contact-email-link";
        producerContactEmail: string;
      }
    | {
        method: "manual";
        claimerEmail: string;
      }
    | {
        method: "domain-email-link";
        domainDomainEmailPart: string;
        domain: string;
      }
    | {
        method: "social-post";
        token: string;
        socialHandle: string;
      }
    | {
        token: string;
        method: "domain-dns";
        domain: string;
      }
    | {
        method: "contact-phone-link";
        producerContactPhone: string;
        tokenExpiresAt: Date;
      };
};

export type DeleteProducerArgs = typeof deleteProducerArgs.infer;

export type IpGeoValidator = typeof ipGeoValidator.infer;

export type SuggestProducerArgs = typeof suggestProducerArgs.infer;

export type SearchProducersArgs = typeof searchProducersArgsValidator.infer;

export type SearchProducersQueryArgs = {
  query?: string;
  limit: number;
  offset: number;
};
