import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function sessionOrRedirect() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function sessionThenRedirect() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }

  return;
}
