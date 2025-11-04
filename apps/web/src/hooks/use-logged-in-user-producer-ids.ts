import { getLoggedInUserProducerIds } from "@/backend/rpc/auth";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export function useLoggedInUserProducerIds({
  producerIds,
}: {
  producerIds: string[];
}) {
  const { userId } = useAuth();
  const { data, ...opts } = useQuery({
    queryKey: ["use-logged-in-producer-ids", userId],
    queryFn: async () => await getLoggedInUserProducerIds(),
    initialData: producerIds,
  });

  return {
    ids: data,
    query: opts,
  };
}
