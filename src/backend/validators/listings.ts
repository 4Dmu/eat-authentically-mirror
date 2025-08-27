import { type } from "arktype";
import { alpha3CountryCodeValidator } from "./country";
import { LatLangBoundsLiteralValidator } from "./maps";

export const LISTING_TYPES = [
  "farm",
  "ranch",
  "eatery",
] as const satisfies ListingTypes[];

export const listingTypesValidator = type("'farm'|'ranch'|'eatery'");

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

export const listingImagesValidator = type({
  items: imageDataValidator.array(),
  primaryImgId: "string|null",
});

export const listingValidator = type({
  id: "string.uuid",
  organizationId: "string|null",
  name: "string",
  type: listingTypesValidator,
  about: "string|null",
  contact: contactValidator.or("null"),
  address: addressValidator.or("null"),
  certifications: certificationValidator.array(),
  commodities: type({
    name: "string",
    varieties: type.string.array(),
  }).array(),
  claimed: "boolean",
  verified: "boolean",
  images: listingImagesValidator,
  video: videoValidator.or(type("null")),
  createdAt: "Date",
  updatedAt: "Date",
  socialMedia: socialMediaValidator,
});

export const editListingFormValidator = type({
  name: "string",
  type: listingTypesValidator,
  about: "string|null",
  address: addressValidator,
  contact: {
    "email?": "string.email|null",
    "phone?": "string|null",
    "website?": "string.url|null",
  },
  images: type({
    primaryImgId: "string|null",
    items: type({
      _type: "'upload'",
      file: "File",
      isPrimary: "boolean",
    })
      .or(imageDataValidator)
      .array(),
  }).narrow((data, ctx) => {
    if (
      (data.primaryImgId && data.items.length === 0) ||
      (data.primaryImgId &&
        data.items.length > 0 &&
        !data.items.some(
          (i) =>
            i._type === "cloudflare" && i.cloudflareId === data.primaryImgId
        ))
    ) {
      return ctx.reject({
        message: "Invalid primary image id",
      });
    }
    return true;
  }),
  video: videoValidator
    .or(type({ _type: "'upload'", file: "File" }))
    .or(type.null),
  certifications: certificationValidator.array(),
  commodities: type({
    name: "string",
    varieties: type.string.array(),
  }).array(),
  socialMedia: socialMediaValidator.or("null"),
});

export const listingFormBasicValidator = type({
  name: "string",
  type: listingTypesValidator,
  about: "string|null",
});

export const publicListingValidator = listingValidator.pick(
  "id",
  "name",
  "type",
  "about",
  "images",
  "claimed",
  "certifications",
  "contact",
  "address",
  "video"
);

export const publicListingLightValidator = listingValidator.pick(
  "id",
  "name",
  "type",
  "images",
  "claimed",
  "certifications",
  "contact",
  "address"
);

export const listListingsArgsValidator = type({
  "type?": listingTypesValidator,
  page: "number",
  "query?": "string",
  certs: type("string").array(),
  "locationSearchArea?": LatLangBoundsLiteralValidator,
});

export const getListingArgsValidator = type({ id: "string.uuid" });

export const editListingArgsValidator = type({
  listingId: type("string"),
  "name?": "string",
  "type?": listingTypesValidator,
  "about?": "string|null",
  contact: editListingFormValidator.get("contact").optional(),
  address: editListingFormValidator.get("address").optional(),
  certifications: editListingFormValidator.get("certifications").optional(),
  commodities: editListingFormValidator.get("commodities").optional(),
  socialMedia: editListingFormValidator.get("socialMedia").optional(),
});

export const registerListingArgsValidator = type({
  name: "string >= 3",
  type: listingTypesValidator,
  about: "string >= 20",
});

export type ListListingsArgs = typeof listListingsArgsValidator.infer;

export type GetListingArgs = typeof getListingArgsValidator.infer;

export type RegisterListingArgs = typeof registerListingArgsValidator.infer;

export type ListingTypes = typeof listingTypesValidator.infer;

export type SocialMedia = typeof socialMediaValidator.infer;

export type Contact = typeof contactValidator.infer;

export type Address = typeof addressValidator.infer;

export type ImageData = typeof imageDataValidator.infer;

export type Listing = typeof listingValidator.infer;

export type PublicListing = typeof publicListingValidator.infer;

export type PublicListingLight = typeof publicListingLightValidator.infer;

export type Certification = typeof certificationValidator.infer;

export type EditListingArgs = typeof editListingArgsValidator.infer;
