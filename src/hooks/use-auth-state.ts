import { AuthState, getAuthState } from "@/backend/rpc/auth";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export function useAuthState(props?: { initialData?: AuthState }) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["auth-state", userId],
    initialData: props?.initialData,
    queryFn: () => getAuthState(),
  });
}
