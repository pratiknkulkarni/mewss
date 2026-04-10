import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldGroup,
} from "../ui/field"

import { authClient } from "../../features/auth/api/auth-client"
import { Route } from "../../routes/_auth/login"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate({ from: Route.id })

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setLoading(true)

    await authClient.signIn.email({
      email,
      password,
      fetchOptions: {
        onError: ({ error }) => {
          console.error("Login error:", error)
          setLoading(false)
        },
        onSuccess: () => {
          navigate({
            to: "/home",
            replace: true,
          })
        },
      },
    })
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
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a href="#" className="ml-auto text-sm hover:underline">
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Field>


        {/* Footer */}
        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

