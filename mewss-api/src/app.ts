import {Hono} from 'hono'
import {auth} from "./lib/auth.js";
import feedRouter from "./routes/feed.js";
import articleRouter from "./routes/article.js";
import dataRouter from "./routes/data.js";
import settingsRouter from "./routes/settings.js";
import {createLogger} from "./lib/logger.js";
import {AppError} from "./errors/errors.js";
import {cors} from 'hono/cors';

export const app = new Hono()
const logger = createLogger("app");

app.get("/api/health", (c) => c.json({status: "ok"}));

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

// taken from docs, let's see how I handle it
// REF - https://hono.dev/docs/api/hono#error-handling
app.onError((err, c) => {
    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logger.error({err, path: c.req.path}, "application error");
        }
        return c.json({error: {code: err.code, message: err.message}}, err.statusCode as any);
    }
    logger.error({err, path: c.req.path}, "unhandled error")
    return c.json({error: {code: "INTERNAL_ERROR", message: "Internal server error"}}, 500);
});


app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

app.route("/api/feeds", feedRouter);
app.route("/api", articleRouter);
app.route("/api", dataRouter);
app.route("/api/settings", settingsRouter);
// app.route("/api/health", healthRouter);