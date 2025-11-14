import { BackButton } from "@/components/back-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ea/ui/breadcrumb";
import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";

const UserProfilePage = () => (
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
              <BreadcrumbLink
                asChild
                className="cursor-pointer hover:text-primary"
              >
                <Link href={"/dashboard"}>My Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Account</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <BackButton href={"/"} text="Back to Home" />
      </div>
      <div className="">
        <UserProfile
          appearance={{
            elements: {
              rootBox: {
                width: "100%",
              },
              cardBox: {
                width: "100%",
              },
            },
          }}
        />
      </div>
    </div>
  </div>
);

export default UserProfilePage;
