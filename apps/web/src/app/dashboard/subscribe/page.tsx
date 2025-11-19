import { redirect } from "next/navigation";
import { fetchUser } from "@/backend/rpc/auth";
import { ClientPage } from "./page-client";

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
