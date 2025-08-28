import { fetchSubTier } from "@/backend/rpc/auth";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { useQuery } from "@tanstack/react-query";

export function useSubTier({ initialData }: { initialData: SubTier }) {
  const { data, ...query } = useQuery({
    queryKey: ["use-sub-tier"],
    queryFn: async () => await fetchSubTier(),
    initialData: initialData,
  });

  return { subTier: data, query };
}
