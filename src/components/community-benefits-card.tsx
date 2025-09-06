import { MessageProducerDialog } from "./message-producer-dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PublicProducer } from "@/backend/validators/producers";
import Link from "next/link";
import { ReviewProducerDialog } from "./review-producer-dialog";

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
        {producer.claimed && (
          <MessageProducerDialog disabled={isUserListing} producer={producer} />
        )}
        <ReviewProducerDialog disable={isUserListing} producer={producer} />
        {isUserListing && (
          <Button>
            <Link href={"/dashboard"}>View on dashboard</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function CommunityBenefitsCTACard() {
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
