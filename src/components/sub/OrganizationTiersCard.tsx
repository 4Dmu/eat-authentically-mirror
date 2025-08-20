import { Crown, Star } from "lucide-react";
import { TierCard } from "./TierCard";

export function TiersCard() {
  return (
    <div className="grid grid-cols-3 gap-10">
      <TierCard
        color="green"
        name="Free"
        price="$0"
        priceSubtitle="Claim Only"
        pros={[
          "Edit basic info: Yes",
          "Add certifications: Up to 3",
          "Add products: Up to 3",
          "Upload hero images: 1 image",
        ]}
        cons={[
          "Additional images: No",
          "Upload video: No",
          "Featured in listings: No",
        ]}
      />
      <TierCard
        color="blue"
        badge={{ Icon: Star, name: "Popular" }}
        name="Pro"
        price="$29.99"
        priceSubtitle="per month"
        pros={[
          "Edit basic info: Yes",
          "Add certifications: Up to 6",
          "Add products: Up to 10",
          "Upload hero images: 3 images",
          "Additional images: 2 extra",
          "Featured in listings: Randomized",
        ]}
        cons={["Upload video: No"]}
      />
      <TierCard
        color="purple"
        badge={{ Icon: Crown, name: "Premium" }}
        name="Premium"
        price="$69.99"
        priceSubtitle="per month"
        pros={[
          "Edit basic info: Yes",
          "Add certifications: Unlimited",
          "Add products: Unlimited",
          "Upload hero images: 10 images + video",
          "Additional images: Up to 10 total",
          "Featured in listings: Priority slot",
          "Upload video: Yes",
        ]}
        cons={[]}
      />
    </div>
  );
}
