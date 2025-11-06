import { AppWrapper } from "@/components/app-wrapper";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { sessionOrRedirect } from "@/lib/auth-helpers";

export default async function Home() {
  await sessionOrRedirect();

  return (
    <AppWrapper crumbs={[{ url: "/", name: "EA Admin" }]} end="Home">
      <h1 className="font-bold text-2xl">Admin</h1>
    </AppWrapper>
  );
}
