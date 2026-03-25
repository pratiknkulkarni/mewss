import {Hono} from "hono";
import {db} from "../db/db.js";
import {sql} from "drizzle-orm";
import {createLogger} from "../lib/logger.js";

const router = new Hono();
const logger = createLogger("route.health");

router.get("/", async (c) => {
    try {
        await db.execute(sql`SELECT 1`);
        return c.json({status: "ok", db: "ok"});
    } catch (err) {
        logger.error({err}, "health check db ping failed");
        return c.json({status: "degraded", db: "unreachable"}, 503);
    }
});

export default router;