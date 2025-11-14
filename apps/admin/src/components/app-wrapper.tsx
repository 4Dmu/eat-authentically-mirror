import React, { type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ea/ui/breadcrumb";
import { Separator } from "@ea/ui/separator";
import { SidebarInset, SidebarTrigger } from "@ea/ui/sidebar";

export function AppWrapper({
  crumbs,
  end,
  children,
}: {
  crumbs: { name: string; url: string }[];
  end: string;
  children: ReactNode | undefined;
}) {
  return (
    <SidebarInset>
      <header className="flex h-16 border-b shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.name}>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={crumb.url}>
                      {crumb.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {i < crumbs.length - 1 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </React.Fragment>
              ))}
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{end}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="bg-background p-5">{children}</div>
    </SidebarInset>
  );
}
