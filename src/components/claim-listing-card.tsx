import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/button";

export function ClaimListingCard({ name }: { name: string }) {
  return (
    <Card className="bg-amber-300">
      <CardHeader>
        <CardTitle>Claim This Listing</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p>
          Are you the owner of {name}? Claim your listing to manage your profile
          and connect with customers.
        </p>
        <Button>Claim Listing</Button>
      </CardContent>
    </Card>
  );
}
