import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authClient } from '@/features/auth/api/auth-client';
import { queryClient } from '@/lib/query-client';
import { toast } from 'sonner';
import { authKeys } from '@/lib/query-keys';

export const useLogout = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            const { data, error } = await authClient.signOut();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: authKeys.all });

            navigate({
                to: "/login",
                replace: true
            });

            toast.success('Logout success!', {
                position: "bottom-right",
            });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Failed to logout', {
                position: "bottom-right",
            });
        }
    });
};