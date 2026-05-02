import { createFileRoute, redirect } from "@tanstack/react-router"

import { authClient } from "@/features/auth/api/auth-client"
import { LoginForm } from "@/components/auth/login-form"
import { PhraseComponent } from "@/components/auth/phrase-component"
import { authKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_auth/login")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery({
      queryKey: authKeys.session(),
      queryFn: async () => {
        const { data } = await authClient.getSession()
        return data
      },
      staleTime: 1000 * 60 * 15,
    })
    if (session?.user) {
      throw redirect({ to: "/home", replace: true })
    }
  },
  component: LoginComponent,
})


function LoginComponent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <span className="font-medium">MEWSS</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      <PhraseComponent />

    </div>
  )
}
