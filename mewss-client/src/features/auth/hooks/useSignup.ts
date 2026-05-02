import { useMutation } from '@tanstack/react-query'
import { authClient } from '../api/auth-client'

interface SignUpInput {
    email: string
    password: string
    name: string
}

async function signUpFn({ email, password, name }: SignUpInput) {
    const { data, error } = await authClient.signUp.email({ email, password, name })
    if (error) throw new Error(error.message ?? 'Failed to create account')
    return data
}

export function useSignUp() {
    return useMutation({ mutationFn: signUpFn })
}
