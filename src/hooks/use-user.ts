import { fetchUser } from "@/backend/rpc/auth";
import { UserJSON } from "@clerk/backend";
import { useQuery } from "@tanstack/react-query";

export function useUser({
  initialData,
  userId,
}: {
  initialData: UserJSON | null;
  userId?: string | null | undefined;
}) {
  const { data, ...opts } = useQuery({
    queryKey: ["use-user", userId],
    queryFn: async () => await fetchUser(),
    initialData: initialData,
  });

  return {
    user: data,
    query: opts,
  };
}
