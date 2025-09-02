import React from "react";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";

export function AddToPinboardButton() {
  return (
    <Button variant={"brandBrown"}>
      <MapPin />
      <span>Add to Pinboard</span>
    </Button>
  );
}
