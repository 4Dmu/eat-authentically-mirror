import { fetchSubTier, fetchUser } from "@/backend/rpc/auth";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
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
