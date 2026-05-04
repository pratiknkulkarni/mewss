import {useMutation, useQueryClient} from "@tanstack/react-query";
import {authClient} from "@/features/auth/api/auth-client";
import {authKeys} from "@/lib/query-keys.ts";

export const useRevokeOtherSessions = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async () => {
            const {error} = await authClient.revokeOtherSessions();
            if (error) throw new Error(error.message || "Failed to log out of other devices.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: authKeys.sessionList()});
        },
    });
};