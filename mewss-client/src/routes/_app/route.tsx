import {createFileRoute, Outlet, redirect} from '@tanstack/react-router'
import {authClient} from "@/features/auth/api/auth-client.ts";
import {authKeys} from '@/lib/query-keys';
import {ConfirmDialogProvider} from "@/components/ui/confirm-dialog-context.tsx";
import {SettingsProvider, useSettingsContext} from "@/contexts/SettingsContext.tsx";
import {useEffect} from "react";
import {useTheme} from "next-themes";

function ThemeSync() {
    const {settings, isLoading} = useSettingsContext();
    const {setTheme} = useTheme();

    useEffect(() => {
        if (!isLoading) {
            setTheme(settings.theme);
        }
    }, [settings.theme, isLoading]);

    return null;
}

export const Route = createFileRoute('/_app')({
    component: RouteComponent,
    beforeLoad: async ({context}) => {
        const session = await context.queryClient.fetchQuery({
            queryKey: authKeys.session(),
            queryFn: async () => {
                const {data, error} = await authClient.getSession();
                if (error) throw new Error(error.message || 'Failed to fetch session');
                return data;
            },
            // this stale time => even if I revoke any device(s), it'll take at least 2 mins to reflect
            staleTime: 1000 * 60 * 2,
        })

        if (!session?.user) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }

        return {user: session?.user}
    }
})

function RouteComponent() {
    return (<div>
        <SettingsProvider>
            <ThemeSync/>
            <ConfirmDialogProvider>
                <Outlet/>
            </ConfirmDialogProvider>
        </SettingsProvider>
    </div>)
}
