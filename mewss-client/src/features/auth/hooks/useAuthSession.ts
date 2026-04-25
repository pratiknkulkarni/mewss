import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/features/auth/api/auth-client";
import { authKeys } from "@/lib/query-keys";

export const useSession = () => {
    return useQuery({
        queryKey: authKeys.session(),
        queryFn: async () => {
            const { data, error } = await authClient.getSession();
            if (error) throw new Error(error.message || 'Failed to fetch session');
            return data;
        },
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
};