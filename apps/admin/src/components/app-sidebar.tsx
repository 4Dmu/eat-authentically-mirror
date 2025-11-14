"use client";

import { SquareTerminal } from "lucide-react";
import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@ea/ui/sidebar";
import { NavMain } from "./nav-main";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Misc",
      url: "/misc",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Add Producer",
          url: "/misc/add-producer",
        },
        {
          title: "External Api Keys",
          url: "/misc/external-api-keys",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
