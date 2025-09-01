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
import {
  checkClaimDomainDnsOpts,
  listClaimRequestsOpts,
} from "@/utils/producers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BuildingIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLAIM_DNS_TXT_RECORD_NAME } from "@/backend/rpc/helpers/constants";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function ClaimRequestsSection({
  claims,
}: {
  claims: PublicClaimRequest[];
}) {
  const { data } = useQuery(listClaimRequestsOpts({ initialData: claims }));

  if (data?.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BuildingIcon />
          Claim Requests
        </CardTitle>
        <CardAction className="flex gap-2"></CardAction>
      </CardHeader>

      {(data?.length || 0) > 0 && (
        <CardContent className="flex flex-col gap-5">
          {data?.map((p) => (
            <ClaimRequestCard claimRequest={p} key={p.id} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
