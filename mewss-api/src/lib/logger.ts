import pino from "pino";

const isDev = (process.env.NODE_ENV ?? "development") !== "production";

const REDACT_PATHS: string[] = [
    // Auth credentials
    "password",
    "*.password",
    "body.password",

    // Session tokens — taken from Better Auth "session" table
    "token",
    "*.token",

    // OAuth tokens — taken from Better Auth "account" table
    "accessToken",
    "*.accessToken",
    "refreshToken",
    "*.refreshToken",
    "idToken",
    "*.idToken",

    "req.headers.authorization",
    "req.headers.cookie",
    "headers.authorization",
    "headers.cookie",

    "user.email",
    "*.email",
    "ipAddress",
    "*.ipAddress",
];

const logger = pino({
    name: process.env.APPLICATION_NAME || "mewss_api",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level(label) {
            return { level: label }; // return string (like "info") instead of numbers
        },
    },
    serializers: {
        err: pino.stdSerializers.errWithCause, // preserve full error trace
    },
    redact: {
        paths: REDACT_PATHS,
        censor: "[REDACTED]",
    },
    level: process.env.LOG_LEVEL ?? "info",
    // transport: { target: "pino-pretty" },
    // transport: isDev
    //     ? {target: "pino-pretty", options: {colorize: true, ignore: "pid,hostname,name", translateTime: false}}
    //     : undefined,
});

export function createLogger(module: string) {
    return logger.child({ module });
}

export type AppLogger = ReturnType<typeof createLogger>;