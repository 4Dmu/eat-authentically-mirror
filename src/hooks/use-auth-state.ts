import { getAuthState } from "@/backend/rpc/auth";
import { throwErrors } from "@/utils/actions";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export function useAuthState() {
  const { isLoaded, userId } = useAuth();

  const { data, ...rest } = useQuery({
    queryKey: ["auth-state", userId],
    enabled: isLoaded,
    queryFn: () => getAuthState().then((s) => throwErrors(s)),
  });

  return { authState: data, query: { ...rest } };
}
