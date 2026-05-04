import {useQuery} from "@tanstack/react-query";
import {authClient} from "@/features/auth/api/auth-client";
import {authKeys} from "@/lib/query-keys.ts";

export const useListSessions = () => {
    return useQuery({
        queryKey: authKeys.sessionList(),
        queryFn: async () => {
            const {data, error} = await authClient.listSessions();
            if (error) throw new Error(error.message || "Failed to fetch sessions");
            return data ?? [];
        },
    });
};