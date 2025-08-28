import React from "react";
import { ClientPage } from "./page-client";
import { fetchUser } from "@/backend/rpc/auth";
import { redirect } from "next/navigation";

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: "community" | "producer" }>;
}) {
  const params = await searchParams;
  const user = await fetchUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <ClientPage mode={params.mode} user={user} />;
}
