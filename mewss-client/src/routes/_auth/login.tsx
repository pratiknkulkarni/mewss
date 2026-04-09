import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router'
import {authClient} from "../../features/auth/api/auth-client.ts";

export const Route = createFileRoute('/_auth/login')({
    beforeLoad: async () => {
        const {data} = await authClient.getSession();
        if (data?.user) {
            throw redirect({
                to: '/home',
                replace: true
            })
        }
    },
    component: LoginComponent,
})


function LoginComponent() {
    const navigate = useNavigate({from: Route.id});
    const handleLogin = async () => {
        await authClient.signIn.email({
            email: "",
            password: "",
            fetchOptions: {
                onError: (context) => {
                    // console.log("error from login -> ", context.error)
                },
                onSuccess: () => {
                    // console.log("success from login")
                    navigate({
                        to: '/home',
                        replace: true
                    })
                }
            }
        })
    }

    return (<div>
        <h2>Hello "/login/"!</h2>
        <button onClick={handleLogin}>
            Log In For Now
        </button>
    </div>)
}
