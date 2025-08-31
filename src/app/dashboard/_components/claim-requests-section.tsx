"use client";
import { PublicClaimRequest } from "@/backend/validators/producers";
import { AddProducerDialog } from "@/components/add-producer-dialog";
import { ClaimProducerDialog } from "@/components/claim-producer-dialog";
import { ClaimRequestCard } from "@/components/claim-request-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listClaimRequestsOpts } from "@/utils/producers";
import { useQuery } from "@tanstack/react-query";
import { BuildingIcon } from "lucide-react";
import { Suspense } from "react";

export function ClaimRequestsSection({
  claims,
}: {
  claims: PublicClaimRequest[];
}) {
  const { data } = useQuery(listClaimRequestsOpts({ initialData: claims }));

  return (
    <>
      {(data?.length || 0) > 0 && (
        <CardContent className="flex max-md:flex-wrap gap-5">
          {data?.map((p) => (
            <ClaimRequestCard claimRequest={p} key={p.id} />
          ))}
        </CardContent>
      )}
    </>
  );
}
