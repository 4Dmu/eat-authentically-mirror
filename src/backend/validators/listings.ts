import { type } from "arktype";
import z from "zod";

export const LISTING_TYPES = [
  "farm",
  "ranch",
  "eatery",
] as const satisfies ListingTypes[];

export const ListingTypesValidator = type("'farm'|'ranch'|'eatery'");

export const listingTypesValidator = z.enum(["farm", "ranch", "eatery"]);

export const LatLangBoundsLiteralValidator = type({
  east: "number",
  north: "number",
  south: "number",
  west: "number",
});

export const ListListingsArgsValidator = type({
  "type?": ListingTypesValidator,
  page: "number",
  "query?": "string",
  certs: type("string").array(),
  "locationSearchArea?": LatLangBoundsLiteralValidator,
});

export const GetListingArgsValidator = type({ id: "string.uuid" });

export const ContactValidator = type({
  email: "string.email",
  phone: "string",
  website: "string.url",
});

export const contactValidator = z.object({
  email: z.email(),
  phone: z.string(),
  website: z.url(),
});

export const EmptyContactValidator = type({
  email: "undefined",
  phone: "undefined",
  website: "undefined",
});

export const AddressValidator = type({
  city: "string",
  state: "string",
  street: "string",
  zip: "string",
  coordinate: {
    latitude: "number",
    longitude: "number",
  },
});

export const addressValidator = z.object({
  city: z.string(),
  state: z.string(),
  street: z.string(),
  zip: z.string(),
  coordinate: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const ImagesFormValidator = type({
  files: type.instanceOf(File).array(),
});

export const CertificationValidator = type({
  name: "string",
  isVerified: "boolean",
  id: "string",
  createdAt: "Date",
  updatedAt: "Date",
});

export const certificationValidator = z.object({
  name: z.string(),
  isVerified: z.boolean(),
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ImageDataValidator = type({
  _type: "'cloudflare'",
  cloudflareId: "string",
  cloudflareUrl: "string.url",
  alt: "string",
  isPrimary: "boolean",
});

export const imageDataValidator = z.object({
  _type: z.literal("cloudflare"),
  cloudflareId: z.string(),
  cloudflareUrl: z.url(),
  alt: z.string(),
  isPrimary: z.boolean(),
});

export const BusinessHoursValidator = type({});

export const SocialMediaValidator = type({
  twitter: "string.url|null",
  facebook: "string.url|null",
  instagram: "string.url|null",
});

export const socialMediaValidator = z.object({
  twitter: z.url().nullable(),
  facebook: z.url().nullable(),
  instagram: z.url().nullable(),
});

export const VideoValidator = type({ url: "string" });

export const ListingValidator = type({
  id: "string.uuid",
  organizationId: "string|null",
  name: "string",
  type: ListingTypesValidator,
  about: "string|null",
  contact: ContactValidator.or("null"),
  address: AddressValidator.or("null"),
  certifications: CertificationValidator.array(),
  claimed: "boolean",
  verified: "boolean",
  images: ImageDataValidator.array(),
  video: VideoValidator.or(type("null")),
  createdAt: "Date",
  updatedAt: "Date",
  socialMedia: SocialMediaValidator,
});

export const listingEditFormFieldsValidators = {
  name: type("string|undefined"),
  type: ListingTypesValidator.or(type("undefined")),
  about: type("string|undefined"),
  contact: ContactValidator.or(type("undefined")),
  contactFieldsValidators: {
    email: type("string.email"),
    phone: type("string"),
    website: type("string.url"),
  },
  address: AddressValidator.or(type("undefined")),
  addressFieldsValidators: {
    city: type("string"),
    state: type("string"),
    street: type("string"),
    zip: type("string"),
    coordinate: {
      latitude: type("number"),
      longitude: type("number"),
    },
  },
  images: type({
    _type: "'upload'",
    file: type("File"),
    isPrimary: "boolean",
  })
    .or(ImageDataValidator)
    .array()
    .narrow((data, ctx) => {
      if (!data.some((i) => i.isPrimary)) {
        return ctx.reject({
          expected: "one image must be marked isPrimary",
          actual: "no images are marked isPrimary",
        });
      }
      return true;
    })
    .or(type("undefined")),
  video: type("File").or("undefined"),
  certifications: CertificationValidator.array().or("undefined"),
  products: type("string").array().or("undefined"),
  socialMedia: SocialMediaValidator.or("undefined"),
};

export const editListingFormBasicInfoValidator = type({
  name: "string",
  type: ListingTypesValidator,
  about: "string|null",
});

export const editListingFormContactValidator = type({
  email: "string.email",
  phone: "string",
  website: "string.url",
});

export const editListingFormAddressValidator = type({
  city: "string",
  state: "string",
  street: "string",
  zip: "string",
  coordinate: {
    latitude: "number",
    longitude: "number",
  },
});

export const editListingFormImagesValidator = type({
  images: type({
    _type: "'upload'",
    file: "File",
    isPrimary: "boolean",
  })
    .or(ImageDataValidator)
    .array()
    .narrow((data, ctx) => {
      if (!data.some((i) => i.isPrimary)) {
        return ctx.reject({
          expected: "one image must be marked isPrimary",
          actual: "no images are marked isPrimary",
        });
      }
      return true;
    }),
});

export const editListingFormVideoValidator = type({
  video: type("File"),
});
export const editListingFormCertificationsValidator = type({
  certifications: CertificationValidator.array(),
});
export const editListingFormProductsValidator = type({
  products: type("string").array(),
});
export const editListingFormSocialMediaValidator =
  SocialMediaValidator.or("undefined");

export const ListingFormBasicValidator = type({
  name: "string",
  type: ListingTypesValidator,
  about: "string|null",
});

export const ListingRegisterArgsValidator = type({
  name: "string >= 3",
  type: ListingTypesValidator,
  about: "string >= 20",
});

export const OptionalListingRegisterArgsValidator = type({
  name: "string | undefined",
  type: ListingTypesValidator.optional(),
  about: "string >= 20 | undefined",
});

export const PublicListingValidator = ListingValidator.pick(
  "id",
  "name",
  "type",
  "about",
  "images",
  "claimed",
  "certifications",
  "contact",
  "address"
);

export const PublicListingLightValidator = ListingValidator.pick(
  "id",
  "name",
  "type",
  "images",
  "claimed",
  "certifications",
  "contact",
  "address"
);

export type ListListingsArgs = typeof ListListingsArgsValidator.infer;

export type GetListingArgs = typeof GetListingArgsValidator.infer;

export type ListingRegisterArgs = typeof ListingRegisterArgsValidator.infer;

export type ListingTypes = typeof ListingTypesValidator.infer;

export type SocialMedia = typeof SocialMediaValidator.infer;

export type Contact = typeof ContactValidator.infer;

export type Address = typeof AddressValidator.infer;

export type ImageData = typeof ImageDataValidator.infer;

export type Listing = typeof ListingValidator.infer;

export type PublicListing = typeof PublicListingValidator.infer;

export type PublicListingLight = typeof PublicListingLightValidator.infer;

export type Certification = typeof CertificationValidator.infer;
