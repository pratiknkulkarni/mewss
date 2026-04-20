import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    //TODO: fix from environment variable
    baseURL: "http://localhost:3333"
})

export type Session = typeof authClient.$Infer.Session
