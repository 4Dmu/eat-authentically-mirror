import { fetchUser } from "@/backend/rpc/auth";
import { UserJSON } from "@clerk/backend";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export function useUser({ initialData }: { initialData: UserJSON | null }) {
  const { userId } = useAuth();
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
