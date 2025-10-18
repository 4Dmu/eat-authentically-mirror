import Link from "next/link";
import { MessageProducerDialog } from "./message-producer-dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ReviewProducerDialog } from "./review-producer-dialog";
import { ProducerWithAll } from "@/backend/db/schema";

export function CommunityBenefitsCard({
  producer,
  userProducerIds,
}: {
  producer: ProducerWithAll;
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
        {producer.userId !== null && (
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
