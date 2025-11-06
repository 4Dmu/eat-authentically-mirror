import { sessionThenRedirect } from "@/lib/auth-helpers";
import { LoginPageClient } from "./page-client";

export default async function Page() {
  await sessionThenRedirect();
  return <LoginPageClient />;
}
