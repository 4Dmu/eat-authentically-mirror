import { Page } from "./page-client";
import { headers } from "next/headers";
import { CUSTOM_GEO_HEADER_NAME } from "@ea/shared/constants";
import type { Geo } from "@vercel/functions";

export default async function Home() {
  const headerList = await headers();

  const rawGeo = headerList.get(CUSTOM_GEO_HEADER_NAME);
  const parsedGeo = rawGeo
    ? (JSON.parse(Buffer.from(rawGeo, "base64").toString()) as Geo)
    : undefined;

  return <Page userIpGeo={parsedGeo} />;
}
