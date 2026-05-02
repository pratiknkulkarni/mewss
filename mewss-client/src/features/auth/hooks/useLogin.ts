import { useMutation } from "@tanstack/react-query"
import { authClient } from "../api/auth-client"

interface LoginInput {
    email: string
    password: string
}

async function login({ email, password }: LoginInput) {
    const { data, error } = await authClient.signIn.email({ email, password })
    if (error) throw new Error(error.message ?? 'Failed to sign in')
    return data
}

export function useLogin() {
    return useMutation({ mutationFn: login })
}
