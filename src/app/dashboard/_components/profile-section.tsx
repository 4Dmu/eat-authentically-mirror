"use client";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { match } from "ts-pattern";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { UserJSON } from "@clerk/backend";
import { useUser } from "@clerk/nextjs";
import { useSubTier } from "@/hooks/use-sub-tier";
import { useLoggedInUserProducers } from "@/utils/producers";
import { useMemo } from "react";
import { ProducerCardsRow } from "@/backend/db/schema";

export function ProfileSection({
  serverUser,
  producersFromServer,
  subTierFromServer,
}: {
  serverUser: UserJSON;
  producersFromServer: ProducerCardsRow[];
  subTierFromServer: SubTier;
}) {
  const { isLoaded, user: clientUser } = useUser();
  const { subTier } = useSubTier({ initialData: subTierFromServer });
  const user = isLoaded ? clientUser : serverUser;
  const producers = useLoggedInUserProducers({
    initialData: producersFromServer,
  });

  const hasProducers = useMemo(
    () => producers.data !== undefined && producers.data.length > 0,
    [producers.data]
  );

  if (!user) {
    return null;
  }

  return (
    <Card className="">
      <CardHeader className="flex flex-col items-center gap-5">
        <Image
          className="rounded-full aspect-square object-cover"
          width={100}
          height={100}
          alt="profile img"
          src={"image_url" in user ? user.image_url : user.imageUrl}
        />
        <div className="flex flex-col gap-2 items-center">
          <CardTitle className="font-bold text-3xl font-fraunces">
            Account
          </CardTitle>
          <CardDescription>
            {"email_addresses" in user
              ? user?.email_addresses?.find(
                  (e) => e.id === user.primary_email_address_id
                )?.email_address
              : user.emailAddresses.find(
                  (e) => e.id === user.primaryEmailAddressId
                )?.emailAddress}{" "}
            -{" "}
            {"first_name" in user
              ? `${user.first_name} ${user.last_name}`
              : user.fullName}
          </CardDescription>
        </div>
        <div className="flex gap-10">
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Badge variant={"brandRed"}>
              {hasProducers ? "producer" : "member"}
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
          hasProducers ? (
            <>
              <Separator />
              <CardContent className="flex flex-col gap-2 justify-center text-center">
                <h5 className="font-bold text-lg">
                  Your producer profile is live
                </h5>
                <p>
                  You can manage your profile, update details, and connect with
                  the community. Upgrade to unlock advanced tools to grow your
                  reach.
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
                  Browse farms, ranches, and eateries. Save your favorites to
                  your Pinboard, or claim a producer listing if it&apos;s yours.
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
                You&apos;re enjoying exclusive member benefits and helping Eat
                Authentically thrive. Want to represent your own farm, ranch, or
                eatery?
              </p>
              <div className="gap-5 flex flex-wrap justify-center mt-5">
                {!hasProducers && (
                  <Button>Add A Producer Profile (Free)</Button>
                )}
                {!hasProducers && <Button>Claim a Producer Profile</Button>}
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
                You have access to advanced producer tools. Keep your profile
                fresh and make the most of your subscription.
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
                You have access to advanced producer tools. Keep your profile
                fresh and make the most of your subscription.
              </p>
            </CardContent>
          </>
        ))}
      <CardFooter className="flex gap-5 justify-center items-center w-full flex-wrap"></CardFooter>
    </Card>
  );
}
