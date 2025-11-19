import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LoginViaToken } from "./client-page";

export default async function Page(props: {
  searchParams: Promise<{
    token: string;
    redirectUrl?: string;
    jwtSub?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (
    session.userId !== null &&
    (searchParams.jwtSub === undefined ||
      searchParams.jwtSub === session.userId)
  ) {
    redirect(searchParams.redirectUrl ?? "/");
  }

  if (typeof searchParams.token !== "string") {
    redirect("/");
  }

  console.log(props);

  return (
    <LoginViaToken
      redirectUrl={searchParams.redirectUrl}
      token={searchParams.token}
    />
  );
}
