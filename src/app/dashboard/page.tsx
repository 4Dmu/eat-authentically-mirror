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
  CardAction,
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
import { BuildingIcon, EditIcon, EyeIcon, TrashIcon } from "lucide-react";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { Badge } from "@/components/ui/badge";
import { NotSubbed } from "@/components/auth/RequireSub";
import { AddProducerDialog } from "@/components/add-producer-dialog";
import { fetchUserProducers } from "@/backend/rpc/producers";
import { primaryImageUrl, producerSlugFull } from "@/utils/producers";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }
  const producers = await fetchUserProducers();
  const subTier = await getSubTier(user.id);

  return (
    <div className="p-10">
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
              <Badge>{subTier === "Free" ? subTier : subTier.tier}</Badge>
            </div>
            <div className="flex gap-10 underline">
              <Link href={"/dashboard/account"}>Account</Link>
              <Link href={"/dashboard/billing"}>Subscription</Link>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingIcon />
              My Producer Profiles
            </CardTitle>
            <CardAction className="flex gap-2">
              <AddProducerDialog />
              <Button variant={"outline"}>Claim</Button>
            </CardAction>
          </CardHeader>
          {producers.length > 0 && (
            <CardContent className="grid grid-cols-2">
              {producers.map((p) => (
                <Card
                  key={p.id}
                  className="rounded-lg overflow-hidden pt-0 gap-0"
                >
                  <Image
                    src={primaryImageUrl(p)}
                    alt=""
                    className="w-full object-cover"
                    width={600}
                    height={600}
                  />
                  <CardContent className="p-5 flex flex-col gap-2">
                    <p className="font-fraunces text-lg">{p.name}</p>
                    <Badge>{p.type}</Badge>
                    <p>{p.about}</p>
                  </CardContent>
                  <CardFooter className="grid grid-cols-3 gap-2">
                    <Button variant={"outline"} asChild>
                      <Link href={`/producers/${producerSlugFull(p)}`}>
                        <EyeIcon />
                        View
                      </Link>
                    </Button>
                    <Button variant={"outline"} asChild>
                      <Link href={`/dashboard/producers/${p.id}`}>
                        <EditIcon />
                        Edit
                      </Link>
                    </Button>
                    <div>
                      <Button size={"icon"} variant={"destructive"}>
                        <TrashIcon />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>
        <Card className="bg-yellow-200">
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
                <p>For food enthusiasts who want to connect and engage.</p>
                <Button>
                  <Link href={"/dashboard/subscribe?mode=community"}>
                    Upgrade to Community Member
                  </Link>
                </Button>
              </div>
            </NotSubbed>
            <div className="flex flex-col gap-2">
              <p>For businesses who want to grow their reach and sales.</p>
              <Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
