import { createAuthClient } from "better-auth/react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

export const authClient = createAuthClient({
    baseURL: BASE_URL,
})

export type Session = typeof authClient.$Infer.Session
