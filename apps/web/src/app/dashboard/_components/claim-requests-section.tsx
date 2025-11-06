"use client";
import { PublicClaimRequest } from "@ea/validators/producers";
import { ClaimRequestCard } from "@/components/claim-request-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { useListClaimRequests } from "@/utils/producers";
import { BuildingIcon } from "lucide-react";

export function ClaimRequestsSection({
  claims,
}: {
  claims: PublicClaimRequest[];
}) {
  const { data } = useListClaimRequests({ initialData: claims });

  if (data?.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-50" id="claim">
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
