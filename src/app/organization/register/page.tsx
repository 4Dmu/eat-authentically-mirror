import { getUsersOrganizationIdCached } from "@/backend/data/organization";
import { ClientPage } from "./page-client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { userId } = await auth.protect();
  const signedInOrgId = await getUsersOrganizationIdCached(userId);

  if (signedInOrgId) {
    redirect("/organization/profile");
  }

  return <ClientPage />;
}
