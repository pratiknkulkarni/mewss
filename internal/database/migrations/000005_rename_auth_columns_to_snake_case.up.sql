-- The auth tables were created in 000003 with camelCase quoted identifiers
-- because Better Auth's default DDL uses them. I rename everything to
-- snake_case here so the column names are consistent with feed, article,
-- and user_article_states, and so Better Auth's field mappings in auth.ts
-- can be re-enabled.

ALTER TABLE "user"
    RENAME COLUMN "emailVerified" TO email_verified;

ALTER TABLE "user"
    RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE "user"
    RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE "session"
    RENAME COLUMN "userId" TO user_id;

ALTER TABLE "session"
    RENAME COLUMN "expiresAt" TO expires_at;

ALTER TABLE "session"
    RENAME COLUMN "ipAddress" TO ip_address;

ALTER TABLE "session"
    RENAME COLUMN "userAgent" TO user_agent;

ALTER TABLE "session"
    RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE "session"
    RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE "account"
    RENAME COLUMN "userId" TO user_id;

ALTER TABLE "account"
    RENAME COLUMN "accountId" TO account_id;

ALTER TABLE "account"
    RENAME COLUMN "providerId" TO provider_id;

ALTER TABLE "account"
    RENAME COLUMN "accessToken" TO access_token;

ALTER TABLE "account"
    RENAME COLUMN "refreshToken" TO refresh_token;

ALTER TABLE "account"
    RENAME COLUMN "accessTokenExpiresAt" TO access_token_expires_at;

ALTER TABLE "account"
    RENAME COLUMN "refreshTokenExpiresAt" TO refresh_token_expires_at;

ALTER TABLE "account"
    RENAME COLUMN "idToken" TO id_token;

ALTER TABLE "account"
    RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE "account"
    RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE "verification"
    RENAME COLUMN "expiresAt" TO expires_at;

ALTER TABLE "verification"
    RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE "verification"
    RENAME COLUMN "updatedAt" TO updated_at;