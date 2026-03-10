import {serve} from '@hono/node-server'
import {Hono} from 'hono'
import {cors} from "hono/cors";
import {auth} from "./lib/auth.js";

const app = new Hono()

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

app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

app.get('/', (c) => {
    return c.text('Hello Hono!')
})

serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
})
