-- 000003_add_auth_and_user_states.up.sql

CREATE TABLE IF NOT EXISTS "user"
(
    "id"            text        NOT NULL PRIMARY KEY,
    "name"          text        NOT NULL,
    "email"         text        NOT NULL UNIQUE,
    "emailVerified" boolean     NOT NULL,
    "image"         text,
    "createdAt"     timestamptz NOT NULL,
    "updatedAt"     timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "session"
(
    "id"        text        NOT NULL PRIMARY KEY,
    "userId"    text        NOT NULL,
    "token"     text        NOT NULL UNIQUE,
    "expiresAt" timestamptz NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account"
(
    "id"                    text        NOT NULL PRIMARY KEY,
    "userId"                text        NOT NULL,
    "accountId"             text        NOT NULL,
    "providerId"            text        NOT NULL,
    "accessToken"           text,
    "refreshToken"          text,
    "accessTokenExpiresAt"  timestamptz,
    "refreshTokenExpiresAt" timestamptz,
    "scope"                 text,
    "idToken"               text,
    "password"              text,
    "createdAt"             timestamptz NOT NULL,
    "updatedAt"             timestamptz NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "verification"
(
    "id"         text        NOT NULL PRIMARY KEY,
    "identifier" text        NOT NULL,
    "value"      text        NOT NULL,
    "expiresAt"  timestamptz NOT NULL,
    "createdAt"  timestamptz NOT NULL,
    "updatedAt"  timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_article_states"
(
    "user_id"    text    NOT NULL,
    "article_id" uuid    NOT NULL,
    "is_read"    boolean NOT NULL DEFAULT false,
    "read_at"    timestamptz,
    PRIMARY KEY ("user_id", "article_id"),
    FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("article_id") REFERENCES "article" ("id") ON DELETE CASCADE
);