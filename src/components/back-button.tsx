import React, { ComponentProps } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackButton(
  props: Omit<ComponentProps<typeof Link>, "children"> & { text: string }
) {
  return (
    <Link {...props} className="flex gap-2 items-center">
      <ArrowLeft size={20} />
      <span className="font-bold text-sm">{props.text}</span>
    </Link>
  );
}
