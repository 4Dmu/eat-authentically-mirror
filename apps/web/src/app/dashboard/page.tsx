import Link from "next/link";
import { ProfileSection } from "./_components/profile-section";
import { BackButton } from "@/components/back-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { CreditCard, MailIcon, PinIcon, UserIcon } from "lucide-react";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { fetchUserProducers, listClaimRequests } from "@/backend/rpc/producers";
import { ClaimRequestsSection } from "./_components/claim-requests-section";
import { ProducersSection } from "./_components/producers-section";
import { fetchUser } from "@/backend/rpc/auth";

export default async function DashboardPage() {
  const user = await fetchUser();

  if (!user) {
    redirect("/sign-in");
  }

  const producers = await fetchUserProducers();
  const subTier = await getSubTier(user.id);
  const claimRequests = await listClaimRequests();

  return (
    <div className="p-10 pb-20">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer hover:text-primary"
                >
                  <Link href={"/"}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>My Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <BackButton href={"/"} text="Back to Home" />
        </div>

        <ProfileSection
          serverUser={user}
          producersFromServer={producers}
          subTierFromServer={subTier}
        />

        <ProducersSection producers={producers} />

        <ClaimRequestsSection claims={claimRequests} />

        <Card>
          <CardHeader>
            <CardTitle>Manage</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-5 justify-center items-center w-full flex-wrap">
            <Button className="w-32" asChild>
              <Link href={"/dashboard/account"}>
                <UserIcon /> Account
              </Link>
            </Button>
            <Button className="w-32" asChild>
              <Link href={"/dashboard/billing/maybe"}>
                <CreditCard />
                Subscription
              </Link>
            </Button>
            <Button variant={"brandGreen"} className="w-32" asChild>
              <Link href={"/dashboard/chats"}>
                <MailIcon />
                Chats
              </Link>
            </Button>
            <Button variant={"brandBrown"} className="w-32" asChild>
              <Link href={"/dashboard/pinboard"}>
                <PinIcon />
                Pinboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
