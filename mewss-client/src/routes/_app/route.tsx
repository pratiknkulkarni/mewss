import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authClient } from "@/features/auth/api/auth-client.ts";
import { queryClient } from '@/lib/query-client';
import { authKeys } from '@/lib/query-keys';

export const Route = createFileRoute('/_app')({
    component: RouteComponent,
    beforeLoad: async () => {
        const session = await queryClient.fetchQuery({
            queryKey: authKeys.session(),
            queryFn: async () => {
                const { data, error } = await authClient.getSession();
                if (error) throw error;
                return data;
            },
            staleTime: 1000 * 60 * 15,
        })

        if (!session?.user) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }

        return { user: session?.user }
    }
})

function RouteComponent() {
    return (<div>
        <Outlet />
    </div>)
}
