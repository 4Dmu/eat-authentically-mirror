"use client";

import type { CertificationSelect, ProducerWithAll } from "@ea/db/schema";
import type { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { BackButton } from "@/components/back-button";
import { ProducerEditForm } from "@/components/forms/edit-producer-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ea/ui/breadcrumb";
import Link from "next/link";

export function ProducersPageClient({
  producer,
  tier,
  allCertifications,
}: {
  producer: ProducerWithAll;
  allCertifications: CertificationSelect[];
  tier: SubTier;
}) {
  return (
    <main className="p-10 overflow-auto flex flex-col gap-10 h-[calc(100vh_-_68px)] bg-muted">
      <div className="max-w-6xl w-full self-center flex flex-col gap-10 pb-20">
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
                <BreadcrumbPage>{producer.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <BackButton href={"/"} text="Back to Home" />
        </div>
        <ProducerEditForm
          producer={producer}
          certifications={allCertifications}
          tier={tier}
        />
      </div>
    </main>
  );
}
