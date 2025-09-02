import { Star } from "lucide-react";
import { MessageProducerDialog } from "./message-producer-dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PublicProducer } from "@/backend/validators/producers";
import Link from "next/link";

export function CommunityBenefitsCard({
  producer,
  userProducerIds,
}: {
  producer: PublicProducer;
  userProducerIds: string[];
}) {
  const isUserListing = userProducerIds.includes(producer.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Benefits</CardTitle>
        {isUserListing && (
          <p className="text-muted-foreground">
            You cannot message or review your producer.
          </p>
        )}
      </CardHeader>
      <CardContent className="flex gap-3">
        <MessageProducerDialog disabled={isUserListing} producer={producer} />
        <Button disabled={isUserListing} className="w-28">
          <Star />
          Review
        </Button>
        {isUserListing && (
          <Button>
            <Link href={"/dashboard"}>View on dashboard</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function CommunityBenefitsCTACard({}: {}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Community Benefits</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p>Upgrade to review and send direct messages to produces.</p>
        <Button variant={"brandGreen"}>Upgrade</Button>
      </CardContent>
    </Card>
  );
}
