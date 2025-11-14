import type { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@ea/ui/sidebar";

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
