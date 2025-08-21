import { type } from "arktype";

export const LISTING_TYPES = [
  "farm",
  "ranch",
  "eatery",
] as const satisfies ListingTypes[];

export const ListingTypesValidator = type("'farm'|'ranch'|'eatery'");

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

export const AddressFormValidator = type({
  city: "string",
  state: "string",
  street: "string",
  zip: "string",
  coordinate: {
    latitude: "string.numeric.parse",
    longitude: "string.numeric.parse",
  },
});

export const ImagesFormValidator = type({
  files: type.instanceOf(File).array(),
});

export const CertificationValidator = type({
  name: "string",
  isVerified: "boolean",
});

export const ImageDataValidator = type({
  _type: "'cloudflare'",
  cloudflareId: "string",
  cloudflareUrl: "string.url",
  alt: "string",
  isPrimary: "boolean",
});

export const BusinessHoursValidator = type({});

export const SocialMediaValidator = type({
  twitter: "string.url|null",
  facebook: "string.url|null",
  instagram: "string.url|null",
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
  certifications: CertificationValidator.array().or("null"),
  claimed: "boolean",
  verified: "boolean",
  images: ImageDataValidator.array(),
  video: VideoValidator.or(type("null")),
  createdAt: "Date",
  updatedAt: "Date",
  socialmedia: SocialMediaValidator,
  predictedLikeCount: "number|null",
});

export const ListingFormValidator = type({
  name: "string",
  type: ListingTypesValidator,
  about: "string|null",
  contact: ContactValidator.or("null"),
  address: AddressValidator.or("null"),
  certifications: CertificationValidator.array().or("null"),
  images: ImageDataValidator.array(),
  video: VideoValidator.or(type("null")),
  socialmedia: SocialMediaValidator,
});

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
