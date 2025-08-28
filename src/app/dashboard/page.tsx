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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BuildingIcon } from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="bg-gray-50 p-10">
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
            <div className="flex gap-10 underline">
              <Link href={"/account"}>Account</Link>
              <Link href={"/account"}>Subscription</Link>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingIcon />
              My Producer Profiles
            </CardTitle>
            <CardAction>
              <Button>Add New</Button>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
