import { AuthState, getAuthState } from "@/backend/rpc/auth";
import { throwErrors } from "@/utils/actions";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export function useAuthState(props?: { initialData?: AuthState }) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["auth-state", userId],
    initialData: props?.initialData,
    queryFn: () => getAuthState().then((t) => throwErrors(t)),
  });
}
