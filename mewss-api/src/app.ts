import { Hono } from 'hono'
import { auth } from "./lib/auth.js";
import feedRouter from "./routes/feed.js";
import articleRouter from "./routes/article.js";
import dataRouter from "./routes/data.js";
import settingsRouter from "./routes/settings.js";
import { createLogger } from "./lib/logger.js";
import { AppError, RequestTimeoutError } from "./errors/errors.js";
import { cors } from 'hono/cors';

export const app = new Hono()
const logger = createLogger("app");

const REQUEST_TIMEOUT_MS = 10_000;

// this is a global timeout
app.use("/api/*", async (_, next) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        await Promise.race([
            next(), // if this one works, the timer is cleared in finally block
            // else if the timer triggers first, it will reject with a RequestTimeoutError, which is handled in the error handler
            new Promise<never>((_, reject) =>
                controller.signal.addEventListener("abort", () =>
                    reject(new RequestTimeoutError())
                )
            ),
        ]);
    } finally {
        clearTimeout(timer);
    }
});

app.get("/api/health", (c) => c.json({ status: "ok" }));

// this one is not required to run in docker, only for dev server.
if (process.env.NODE_ENV === "development") {
    app.use(
        "/api/*",
        cors({
            origin: process.env.FRONTEND_URL!,
            allowHeaders: ["Content-Type", "Authorization"],
            allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            exposeHeaders: ["Content-Length", "X-Request-Id"],
            maxAge: 600,
            credentials: true,
        })
    );
}

// REF - https://hono.dev/docs/api/hono#error-handling
app.onError((err, c) => {
    if (err.message?.includes("timeout") || (err as any).code === "ECONNECTION") {
        logger.warn({ path: c.req.path }, "db pool timeout");
        return c.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable" } }, 503);
    }
    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logger.error({ err, path: c.req.path }, "application error");
        }
        return c.json({ error: { code: err.code, message: err.message } }, err.statusCode as any);
    }
    logger.error({ err, path: c.req.path }, "unhandled error")
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
});


app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

app.route("/api/feeds", feedRouter);
app.route("/api", articleRouter);
app.route("/api", dataRouter);
app.route("/api/settings", settingsRouter);