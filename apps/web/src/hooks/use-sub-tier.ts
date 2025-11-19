import { fetchSubTier } from "@/backend/rpc/auth";
import type { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export function useSubTier({ initialData }: { initialData: SubTier }) {
  const { userId } = useAuth();
  const { data, ...query } = useQuery({
    queryKey: ["use-sub-tier", userId],
    queryFn: async () => await fetchSubTier(),
    initialData: initialData,
  });

  return { subTier: data, query };
}
