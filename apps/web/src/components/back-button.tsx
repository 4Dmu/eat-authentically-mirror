import { cn } from "@ea/ui/utils";
import type { ComponentProps } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackButton(
  props: Omit<ComponentProps<typeof Link>, "children"> & { text: string }
) {
  return (
    <Link {...props} className={cn("flex gap-2 items-center", props.className)}>
      <ArrowLeft size={20} />
      <span className="font-bold text-sm">{props.text}</span>
    </Link>
  );
}
