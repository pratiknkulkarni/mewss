import {Hono} from 'hono'
import {auth} from "./lib/auth.js";
import feedRouter from "./routes/feed.js";
import {createLogger} from "./lib/logger.js";
import {AppError} from "./errors/errors.js";

export const app = new Hono()
const logger = createLogger("app");

// commenting this out for now since HTTPIE is throwing up
// app.use(
//     "/api/*",
//     cors({
//         origin: process.env.FRONTEND_URL!,
//         allowHeaders: ["Content-Type", "Authorization"],
//         allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//         exposeHeaders: ["Content-Length", "X-Request-Id"],
//         maxAge: 600,
//         credentials: true,
//     })
// );

// taken from docs, let's see how I handle it
// REF - https://hono.dev/docs/api/hono#error-handling
app.onError((err, c) => {
    if (err instanceof AppError) {
        return c.json({error: {code: err.code, message: err.message}}, err.statusCode as any);
    }
    logger.error({err, path: c.req.path}, "unhandled error")
    return c.json({error: {code: "INTERNAL_ERROR", message: "Internal server error"}}, 500);
});


app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

app.route("/api/feeds", feedRouter);