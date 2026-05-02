import { useState } from "react"
import { useNavigate, Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field"
import { Route } from "@/routes/_auth/login"
import { toast } from "sonner"
import { useLogin } from "@/features/auth/hooks/useLogin"
import { authKeys } from "@/lib/query-keys"
import { queryClient } from "@/lib/query-client"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate({ from: Route.id })

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { mutate: signIn, isPending } = useLogin()

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {

    e.preventDefault()

    signIn(
      { email, password },
      {
        onSuccess: (sessionData) => {
          queryClient.setQueryData(authKeys.session(), sessionData) // adding this in the cache manually so it doesn't fire a request
          toast.success('Login success!', { position: 'bottom-right' })
          navigate({ to: '/home', replace: true })
        },
        onError: (err: any) => {
          toast.error(err.message || 'Invalid email or password!', {
            position: 'bottom-right',
          })
        },
      },
    )
  }

  return (
    <form
      onSubmit={handleLogin}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to login
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link to="/forgot-password" className="ml-auto text-sm hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Logging in..." : "Login"}
          </Button>
        </Field>

        {/* Footer */}
        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
