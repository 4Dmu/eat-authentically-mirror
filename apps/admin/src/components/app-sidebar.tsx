"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@ea/ui/sidebar";
import { FactoryIcon, SignatureIcon, SquareTerminal } from "lucide-react";
import type * as React from "react";
import { NavMain } from "./nav-main";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Producers",
      url: "/producers",
      icon: FactoryIcon,
      isActive: true,
      items: [
        {
          title: "List Producers",
          url: "/producers",
        },
        {
          title: "Add Producer",
          url: "/producers/create",
        },
      ],
    },
    {
      title: "Suggested Producers",
      url: "/suggested-producers",
      icon: SignatureIcon,
      isActive: true,
    },
    {
      title: "Misc",
      url: "/misc",
      icon: SquareTerminal,
      isActive: true,
      items: [
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
