import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/features/auth/api/auth-client";
import { authKeys } from "@/lib/query-keys";

export const useAuthSession = () => {
    return useQuery({
        queryKey: authKeys.session(),
        queryFn: async () => {
            const { data, error } = await authClient.getSession();
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 15,
    });
};