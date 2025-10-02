import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RefObject } from "react";

export function ProducerForm({
  ref,
}: {
  ref: RefObject<HTMLInputElement | null>;
}) {
  return (
    <Card className="w-full" id="producer">
      <CardHeader>
        <CardTitle className="text-3xl font-fraunces">
          For those who grow and serve authentic food.
        </CardTitle>
        <CardDescription>
          Connect with conscious eaters who are looking for what you do best.
          Add your farm, ranch, or eatery today—if you’re already on our map,
          we’ll update your info and mark your listing as yours.{" "}
          <span className="text-xs text-red-500">* (pending verification)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className=" flex flex-col gap-2">
          <Input ref={ref} placeholder="Listing name" />
          <Input placeholder="Email" type="email" />
          <Input placeholder="Phone" type="tel" />
          <Input placeholder="Website" type="url" />
          <Input placeholder="Address" />
          <Button>Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
}
