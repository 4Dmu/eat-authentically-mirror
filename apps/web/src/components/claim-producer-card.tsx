import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/button";
import Link from "next/link";

export function ClaimProducerCard({ name, id }: { name: string; id: string }) {
  return (
    <Card className="bg-[#DCFCE7] shadow-none">
      <CardHeader>
        <CardTitle>Claim This Listing</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p>
          Are you the owner of {name}? Claim your listing to manage your profile
          and connect with customers.
        </p>
        <Button variant={"brandGreen"} asChild>
          <Link href={`/dashboard/claim-producer/${id}`}>Claim Listing</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
