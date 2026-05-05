import {useMutation} from "@tanstack/react-query";
import {authClient} from "@/features/auth/api/auth-client";

async function deleteAccount() {
    const {data, error} = await authClient.deleteUser();
    if (error) throw new Error(error.message ?? "Failed to delete account");
    return data;
}

export function useDeleteAccount() {
    return useMutation({mutationFn: deleteAccount});
}