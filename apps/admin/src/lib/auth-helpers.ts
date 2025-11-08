import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

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
  console.log(session);

  if (session) {
    redirect("/");
  }

  return;
}
