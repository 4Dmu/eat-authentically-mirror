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
import {
  CreditCard,
  EditIcon,
  MailIcon,
  PinIcon,
  UserIcon,
} from "lucide-react";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { Badge } from "@/components/ui/badge";
import { fetchUserProducers, listClaimRequests } from "@/backend/rpc/producers";
import { ClaimRequestsSection } from "./_components/claim-requests-section";
import { ProducersSection } from "./_components/producers-section";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { match } from "ts-pattern";
import { cn } from "@/lib/utils";

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
              className="rounded-full aspect-square object-cover"
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
          </CardHeader>
          {match(subTier)
            .with("Free", () =>
              producers.length > 0 ? (
                <>
                  <Separator />
                  <CardContent className="flex flex-col gap-2 justify-center text-center">
                    <h5 className="font-bold text-lg">
                      Your producer profile is live
                    </h5>
                    <p>
                      You can manage your profile, update details, and connect
                      with the community. Upgrade to unlock advanced tools to
                      grow your reach.
                    </p>
                    <div className="gap-5 flex flex-wrap justify-center mt-5">
                      <Button variant={"brandGreen"}>
                        <Link
                          href={
                            subTier === "Free"
                              ? "/dashboard/subscribe?mode=producer"
                              : "/dashboard/billing"
                          }
                        >
                          Upgrade to Producer Pro
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <>
                  <Separator />
                  <CardContent className="flex flex-col gap-2 justify-center text-center">
                    <h5 className="font-bold text-lg">
                      Welcome to Eat Authentically
                    </h5>
                    <p>
                      Browse farms, ranches, and eateries. Save your favorites
                      to your Pinboard, or claim a producer listing if it&apos;s
                      yours.
                    </p>
                    <div className="gap-5 flex flex-wrap justify-center mt-5">
                      <Button>Add A Producer Profile (Free)</Button>
                      <Button>Claim a Producer Profile</Button>
                      <Button variant={"brandGreen"}>
                        <Link
                          href={
                            subTier === "Free"
                              ? "/dashboard/subscribe?mode=community"
                              : "/dashboard/billing"
                          }
                        >
                          Upgrade to Community Member
                        </Link>
                      </Button>
                      <Button variant={"brandGreen"}>
                        <Link
                          href={
                            subTier === "Free"
                              ? "/dashboard/subscribe?mode=producer"
                              : "/dashboard/billing"
                          }
                        >
                          Become a Paid Producer
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </>
              )
            )
            .with({ tier: "community" }, () => (
              <>
                <Separator />
                <CardContent className="flex flex-col gap-2 justify-center text-center">
                  <h5 className="font-bold text-lg">
                    Thanks for supporting the community
                  </h5>
                  <p>
                    You&apos;re enjoying exclusive member benefits and helping
                    Eat Authentically thrive. Want to represent your own farm,
                    ranch, or eatery?
                  </p>
                  <div className="gap-5 flex flex-wrap justify-center mt-5">
                    {producers.length === 0 && (
                      <Button>Add A Producer Profile (Free)</Button>
                    )}
                    {producers.length === 0 && (
                      <Button>Claim a Producer Profile</Button>
                    )}
                    <Button variant={"brandGreen"}>
                      <Link
                        href={
                          subTier === "Free"
                            ? "/dashboard/subscribe?mode=producer"
                            : "/dashboard/billing"
                        }
                      >
                        Upgrade to Producer Pro
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </>
            ))
            .with({ tier: "pro" }, { tier: "premium" }, (t) => (
              <>
                <Separator />
                <CardContent className="flex flex-col gap-2 justify-center text-center">
                  <h5 className="font-bold text-lg">
                    You&apos;re a {t.tier} Producer
                  </h5>
                  <p>
                    You have access to advanced producer tools. Keep your
                    profile fresh and make the most of your subscription.
                  </p>
                  <div className="gap-5 flex flex-wrap justify-center mt-5">
                    <Button variant={"brandGreen"}>
                      <Link
                        href={
                          subTier === "Free"
                            ? "/dashboard/subscribe?mode=producer"
                            : "/dashboard/billing"
                        }
                      >
                        Compare Plans / Upgrade
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </>
            ))
            .otherwise((t) => (
              <>
                <Separator />
                <CardContent className="flex flex-col gap-2 justify-center text-center">
                  <h5 className="font-bold text-lg">
                    You&apos;re a {t.tier} Producer
                  </h5>
                  <p>
                    You have access to advanced producer tools. Keep your
                    profile fresh and make the most of your subscription.
                  </p>
                </CardContent>
              </>
            ))}
          <CardFooter className="flex gap-5 justify-center items-center w-full flex-wrap"></CardFooter>
        </Card>

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
