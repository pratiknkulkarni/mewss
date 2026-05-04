import {useMutation, useQueryClient} from "@tanstack/react-query";
import {authClient} from "@/features/auth/api/auth-client";
import {authKeys} from "@/lib/query-keys.ts";

export const useRevokeSession = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (token: string) => {
            const {error} = await authClient.revokeSession({token});
            if (error) throw new Error(error.message || "Failed to revoke session.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: authKeys.sessionList()});
        },
    });
};
