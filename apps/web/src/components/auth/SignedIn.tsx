import { useUser } from "@/hooks/use-user";
import { UserJSON } from "@clerk/backend";
import { PropsWithChildren } from "react";

export default function SignedIn({
  userFromServer,
  children,
}: {
  userFromServer: UserJSON | null;
} & PropsWithChildren) {
  const { user } = useUser({ initialData: userFromServer });

  if (!user) {
    return null;
  }

  return children;
}
