"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, []);

  return null;
}
