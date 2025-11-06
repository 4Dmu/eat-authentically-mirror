import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PropsWithChildren } from "react";

export default function Layout(props: PropsWithChildren) {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        {props.children}
      </SidebarProvider>
    </div>
  );
}
