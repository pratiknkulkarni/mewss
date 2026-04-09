import {createFileRoute, redirect} from '@tanstack/react-router'
import {authClient} from "../../features/auth/api/auth-client.ts";

export const Route = createFileRoute('/home/')({
    component: RouteComponent,
    beforeLoad: async () => {
        const {data, error} = await authClient.getSession();
        console.log(data, error);
        const user = data?.user || null;

        if (!user) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }

        return {user}
    }
})

function RouteComponent() {
    return <div>Hello "/home/"!</div>
}
