import { type } from "arktype";
import { alpha3CountryCodeValidator } from "./country";
import { LatLangBoundsLiteralValidator } from "./maps";

export const PRODUCER_TYPES = [
  "farm",
  "ranch",
  "eatery",
] as const satisfies ProducerTypes[];

export const producerTypesValidator = type("'farm'|'ranch'|'eatery'");

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

export const producerImagesValidator = type({
  items: imageDataValidator.array(),
  primaryImgId: "string|null",
});

export const producerValidator = type({
  id: "string.uuid",
  userId: "string|null",
  name: "string",
  type: producerTypesValidator,
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
  images: producerImagesValidator,
  video: videoValidator.or(type("null")),
  createdAt: "Date",
  updatedAt: "Date",
  socialMedia: socialMediaValidator,
});

export const editProducerFormValidator = type({
  name: "string",
  type: producerTypesValidator,
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

export const producerFormBasicValidator = type({
  name: "string",
  type: producerTypesValidator,
  about: "string|null",
});

export const publicProducerValidator = producerValidator.pick(
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

export const publicProducerLightValidator = producerValidator.pick(
  "id",
  "name",
  "type",
  "images",
  "claimed",
  "certifications",
  "contact",
  "address"
);

export const listProducersArgsValidator = type({
  "type?": producerTypesValidator,
  page: "number",
  "query?": "string",
  certs: type("string").array(),
  "locationSearchArea?": LatLangBoundsLiteralValidator,
});

export const getProducersArgsValidator = type({ id: "string.uuid" });

export const editProducerArgsValidator = type({
  producerId: type("string"),
  "name?": "string",
  "type?": producerTypesValidator,
  "about?": "string|null",
  contact: editProducerFormValidator.get("contact").optional(),
  address: editProducerFormValidator.get("address").optional(),
  certifications: editProducerFormValidator.get("certifications").optional(),
  commodities: editProducerFormValidator.get("commodities").optional(),
  socialMedia: editProducerFormValidator.get("socialMedia").optional(),
});

export const registerProducerArgsValidator = type({
  name: "string >= 3",
  type: producerTypesValidator,
  about: "string >= 20",
});

export type ListProducerArgs = typeof listProducersArgsValidator.infer;

export type GetProducerArgs = typeof getProducersArgsValidator.infer;

export type RegisterProducerArgs = typeof registerProducerArgsValidator.infer;

export type ProducerTypes = typeof producerTypesValidator.infer;

export type SocialMedia = typeof socialMediaValidator.infer;

export type Contact = typeof contactValidator.infer;

export type Address = typeof addressValidator.infer;

export type ImageData = typeof imageDataValidator.infer;

export type Producer = typeof producerValidator.infer;

export type PublicProducer = typeof publicProducerValidator.infer;

export type PublicProducerLight = typeof publicProducerLightValidator.infer;

export type Certification = typeof certificationValidator.infer;

export type EditProducerArgs = typeof editProducerArgsValidator.infer;
