import { ProducerSelect } from "@/backend/db/schema";
import { env } from "@/env";
import {
  Text,
  Heading,
  Html,
  Tailwind,
  Row,
  Img,
  Column,
  Container,
  Button,
} from "@react-email/components";
import * as React from "react";

export default function SocialClaimListingInternalEmail({
  producer: {
    id,
    userId,
    name,
    type,
    claimed,
    verified,
    scrapeMeta,
    socialMedia,
    address,
    createdAt,
    updatedAt,
    contact,
  },
  token,
  socialHandle,
}: {
  producer: ProducerSelect;
  socialHandle: string;
  token: string;
}) {
  return (
    <Html className="w-screen">
      <Tailwind>
        <Container className="p-5">
          <Row>
            <Column className="">
              <Img
                alt=""
                className=""
                width={100}
                height={100}
                src={`${env.SITE_URL}/logo.png`}
              />
              <Heading as="h1">Social Claim Reqest For {name}</Heading>
              <Button
                className="p-2 bg-gray-900 rounded text-white"
                href={socialHandle}
              >
                Visit Social Handle
              </Button>
              <Text>Choosen Social Handle: {socialHandle}</Text>
              <Text className="break-all">Token: {token}</Text>
              <Heading as="h5">
                Producer Details For Reference (Ommited images and video for
                brevity)
              </Heading>
              <Text className="whitespace-break-spaces break-all">
                {JSON.stringify(
                  {
                    id,
                    userId,
                    name,
                    type,
                    claimed,
                    verified,
                    scrapeMeta,
                    socialMedia,
                    address,
                    createdAt,
                    updatedAt,
                    contact,
                  },
                  null,
                  2,
                )}
              </Text>
            </Column>
          </Row>
        </Container>
      </Tailwind>
    </Html>
  );
}

SocialClaimListingInternalEmail.PreviewProps = {
  producer: {
    id: "40e8adb9-6220-46e6-98e5-5e7ba164fde8",
    userId: "user_31Y2ntdPZx4r63KJUXAFXMCctVY",
    name: "Bobs Ranch",
    type: "farm",
    claimed: true,
    verified: false,
    about: "Bobs ranch is super cool and awesome.",
    images: {
      items: [
        {
          _type: "cloudflare",
          cloudflareId: "02277c18-451f-4dd7-4d07-ee20d614f700",
          cloudflareUrl:
            "https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/02277c18-451f-4dd7-4d07-ee20d614f700/public",
          alt: "",
        },
        {
          _type: "cloudflare",
          cloudflareId: "250188fc-d0cd-4343-44a6-50794006fd00",
          cloudflareUrl:
            "https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/250188fc-d0cd-4343-44a6-50794006fd00/public",
          alt: "",
        },
        {
          _type: "cloudflare",
          cloudflareId: "1bfc4328-a3e4-4e13-f509-5c4edfa2f200",
          cloudflareUrl:
            "https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/1bfc4328-a3e4-4e13-f509-5c4edfa2f200/public",
          alt: "",
        },
        {
          _type: "cloudflare",
          cloudflareId: "d2acd51f-13d2-4f34-fe10-2cb2d5fc6400",
          cloudflareUrl:
            "https://imagedelivery.net/KWDgyq5E4Zh6Zcz8iQyYUA/d2acd51f-13d2-4f34-fe10-2cb2d5fc6400/public",
          alt: "",
        },
      ],
      primaryImgId: "02277c18-451f-4dd7-4d07-ee20d614f700",
    },
    pendingImages: [],
    commodities: [],
    pendingVideos: null,
    socialMedia: { twitter: null, facebook: null, instagram: null },
    contact: {},
    address: {},
    video: null,
    scrapeMeta: null,
    createdAt: "2025-08-28T20:32:34.000Z",
    updatedAt: "2025-08-28T21:49:31.000Z",
    certifications: [],
  },
  socialHandle: "fake.com",
  token: "a-fake-long-token-string",
};
