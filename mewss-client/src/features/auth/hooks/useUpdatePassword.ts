import {useMutation} from "@tanstack/react-query";
import {authClient} from "@/features/auth/api/auth-client";

interface UpdatePasswordInput {
    newPassword: string;
    currentPassword: string;
    revokeOtherSessions?: boolean;
}

async function updatePassword({newPassword, currentPassword, revokeOtherSessions}: UpdatePasswordInput) {
    const {data, error} = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions
    });

    if (error) throw new Error(error.message ?? 'Failed to update password');
    return data;
}

export function useUpdatePassword() {
    return useMutation({mutationFn: updatePassword});
}