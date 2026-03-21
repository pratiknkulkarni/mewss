import {serve} from '@hono/node-server'
import {createLogger} from "./lib/logger.js";
import {app} from "./app.js";

const logger = createLogger("app");

serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    logger.info({port: info.port}, "server running");
})
