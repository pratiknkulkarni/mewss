import {serve} from '@hono/node-server'
import {Hono} from 'hono'
import {auth} from "./lib/auth.js";
import feedRouter from "./routes/feed.js";

const app = new Hono()

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
    console.error(`${err}`)
    return c.text('Custom Error Message', 500)
})

app.on(["POST", "GET"], "/api/auth/*", (c) => {
    console.log("here and there")
    return auth.handler(c.req.raw);
});

app.route("/api/feeds", feedRouter);

serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
})
