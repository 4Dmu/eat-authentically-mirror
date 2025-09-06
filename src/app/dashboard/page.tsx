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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CreditCard, EditIcon } from "lucide-react";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { Badge } from "@/components/ui/badge";
import { NotSubbed } from "@/components/auth/RequireSub";
import { fetchUserProducers, listClaimRequests } from "@/backend/rpc/producers";
import { ClaimRequestsSection } from "./_components/claim-requests-section";
import { ProducersSection } from "./_components/producers-section";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { match } from "ts-pattern";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
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

        <Card className="">
          <CardHeader className="flex flex-col items-center gap-5">
            <Image
              className="rounded-full"
              width={100}
              height={100}
              alt="profile img"
              src={user?.imageUrl}
            />
            <div className="flex flex-col gap-2 items-center">
              <CardTitle className="font-bold text-3xl font-fraunces">
                Account
              </CardTitle>
              <CardDescription>
                {user.primaryEmailAddress?.emailAddress} - {user.fullName}
              </CardDescription>
            </div>
            <div className="flex gap-10">
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Badge variant={"brandRed"}>
                  {producers.length > 0 ? "producer" : "member"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Subscription</Label>
                <Badge variant={"brandGreen"}>
                  {subTier === "Free" ? subTier : subTier.tier}
                </Badge>
              </div>
            </div>
            {/*<div className="flex gap-10 underline">
              <Link href={"/dashboard/account"}>Account</Link>
              <Link href={"/dashboard/billing"}>Subscription</Link>
            </div>*/}
          </CardHeader>
          {(subTier === "Free" || subTier.tier !== "enterprise") && (
            <>
              <Separator />
              <CardContent>
                <Card className="bg-[#DCFCE7] shadow-none">
                  <CardHeader>
                    <CardTitle>Upgrade</CardTitle>
                    <CardDescription>
                      {subTier == "Free"
                        ? "Upgrade to a payed subscription to unlock our best features."
                        : "Upgrade to a payed producer subscription to increase search revelence, add extra images and even video."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-10">
                    <NotSubbed initialSubTier={subTier}>
                      <div className="flex flex-col gap-2">
                        <p>
                          For food enthusiasts who want to connect and engage.
                        </p>
                        <Button>
                          <Link href={"/dashboard/subscribe?mode=community"}>
                            Upgrade to Community Member
                          </Link>
                        </Button>
                      </div>
                    </NotSubbed>
                    {match(subTier)
                      .with("Free", { tier: "community" }, () => (
                        <div className="flex flex-col gap-2">
                          <p>
                            For businesses who want to grow their reach and
                            sales.
                          </p>
                          <Button variant={"brandGreen"}>
                            <Link
                              href={
                                subTier === "Free"
                                  ? "/dashboard/subscribe?mode=producer"
                                  : "/dashboard/billing"
                              }
                            >
                              Upgrade Your Producer Listing
                            </Link>
                          </Button>
                        </div>
                      ))
                      .otherwise(() => (
                        <div className="flex flex-col gap-2 col-span-2">
                          <p>Upgrade to the</p>
                          <Button variant={"brandGreen"}>
                            <Link
                              href={
                                subTier === "Free"
                                  ? "/dashboard/subscribe?mode=producer"
                                  : "/dashboard/billing"
                              }
                            >
                              Upgrade Your Subscription
                            </Link>
                          </Button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </CardContent>
            </>
          )}
          <Separator />
          <CardFooter className="flex gap-5 justify-center items-center w-full">
            <Button className="w-32" asChild>
              <Link href={"/dashboard/account"}>
                <EditIcon /> Account
              </Link>
            </Button>
            <Button className="w-32" asChild>
              <Link href={"/dashboard/billing/maybe"}>
                <CreditCard />
                Subscription
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <ProducersSection producers={producers} />

        <ClaimRequestsSection claims={claimRequests} />
      </div>
    </div>
  );
}
