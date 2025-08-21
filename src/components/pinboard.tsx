import React from "react";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";

export function AddToPinboardButton() {
  return (
    <Button variant={"secondary"}>
      <MapPin />
      <span>Add to Pinboard</span>
    </Button>
  );
}
