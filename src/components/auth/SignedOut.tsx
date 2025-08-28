import { useUser } from "@/hooks/use-user";
import { UserJSON } from "@clerk/backend";
import { useAuth } from "@clerk/nextjs";
import { PropsWithChildren } from "react";

export default function SignedOut({
  userFromServer,
  children,
}: {
  userFromServer: UserJSON | null;
} & PropsWithChildren) {
  const { userId } = useAuth();
  const { user } = useUser({ initialData: userFromServer, userId });

  if (user) {
    return null;
  }

  return children;
}
