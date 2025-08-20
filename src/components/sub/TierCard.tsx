import { CheckIcon, LucideProps, XIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function TierCard({
  name,
  price,
  priceSubtitle,
  pros,
  cons,
  badge,
  color,
  selected,
  select,
  onSelectedChange,
}: {
  name: string;
  price: string;
  priceSubtitle: string;
  pros: string[];
  cons: string[];
  single?: boolean;
  selected?: boolean;
  onSelectedChange?: (value: boolean) => void;
  select?: () => void;
  badge?: {
    name: string;
    Icon?: React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
  };
  color: "green" | "blue" | "purple";
}) {
  return (
    <Card
      onClick={() => {
        if (onSelectedChange) {
          onSelectedChange(!selected);
        } else if (select) {
          select();
        }
      }}
      className={cn(
        "border-2 relative",
        !selected && "hover:border-black/50",
        selected && color === "blue" && "border-blue-500 bg-blue-500/5",
        selected && color === "green" && "border-green-500 bg-green-500/5",
        selected && color === "purple" && "border-purple-500 bg-purple-500/5"
      )}
    >
      {badge && (
        <Badge
          className={cn(
            "rounded-full absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2",
            color === "blue" && "bg-blue-500",
            color === "green" && "bg-green-500",
            color === "purple" && "bg-purple-500"
          )}
        >
          {badge.Icon && <badge.Icon />} <span>{badge.name}</span>
        </Badge>
      )}
      <CardHeader>
        <p className="font-bold text-lg">{name}</p>
        <CardTitle className="font-bold text-3xl">{price}</CardTitle>
        <p className="text-muted-foreground">{priceSubtitle}</p>
      </CardHeader>
      <CardContent>
        {pros.map((pro) => (
          <div className="flex gap-2" key={pro}>
            <CheckIcon className="size-5 text-green-500" />
            <p>{pro}</p>
          </div>
        ))}
        {cons.map((con) => (
          <div className="flex gap-2" key={con}>
            <XIcon className="size-5 text-destructive" />
            <p>{con}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SingleTierCard({
  title,
  pros,
  cons,
  badge,
  color,
  submit,
}: {
  title: ReactNode;
  pros: string[];
  cons: string[];
  badge?: {
    name: string;
    Icon?: React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
  };
  color: "green" | "blue" | "purple";
  submit: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "border-2 relative",
        color === "blue" && "border-blue-500 bg-blue-500/5",
        color === "green" && "border-primary bg-green-500/5",
        color === "purple" && "border-purple-500 bg-purple-500/5"
      )}
    >
      {badge && (
        <Badge
          className={cn(
            "rounded-full absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2",
            color === "blue" && "bg-blue-500",
            color === "green" && "bg-primary",
            color === "purple" && "bg-purple-500"
          )}
        >
          {badge.Icon && <badge.Icon />} <span>{badge.name}</span>
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="font-bold text-3xl text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pros.map((pro) => (
          <div className="flex gap-2" key={pro}>
            <CheckIcon className="size-5 text-green-500" />
            <p>{pro}</p>
          </div>
        ))}
        {cons.map((con) => (
          <div className="flex gap-2" key={con}>
            <XIcon className="size-5 text-destructive" />
            <p>{con}</p>
          </div>
        ))}
      </CardContent>
      <CardFooter>{submit}</CardFooter>
    </Card>
  );
}
