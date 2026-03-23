import {betterAuth} from "better-auth";
import {Pool} from "pg";

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL!,
        // user: process.env.DATABASE_USER,
        // host: process.env.DATABASE_HOST,
        // database: process.env.DATABASE_NAME,
        // password: process.env.DATABASE_PASSWORD,
        // port: Number(process.env.DATABASE_PORT),
    }),
    trustedOrigins: [process.env.FRONTEND_URL!, "http://localhost:3000"],
    emailAndPassword: {enabled: true},
    session: {
        expiresIn: 7 * 24 * 60 * 60,
        cookieCache: {enabled: true, maxAge: 5 * 60},
        fields: {
            userId: "user_id",
            expiresAt: "expires_at",
            ipAddress: "ip_address",
            userAgent: "user_agent",
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    },
    user: {
        fields: {
            emailVerified: "email_verified",
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    },
    account: {
        fields: {
            accountId: "account_id",
            providerId: "provider_id",
            userId: "user_id",
            accessToken: "access_token",
            refreshToken: "refresh_token",
            idToken: "id_token",
            accessTokenExpiresAt: "access_token_expires_at",
            refreshTokenExpiresAt: "refresh_token_expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    },
    verification: {
        fields: {
            expiresAt: "expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    }
})

export type Auth = typeof auth