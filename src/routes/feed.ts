import {Hono} from "hono";
import {requireAuth} from "../middleware/auth.js";
import {auth} from "../lib/auth.js";
import {createFeed, createFeedSchema, listFeeds} from "../services/feed.service.js";
import {zValidator} from "@hono/zod-validator";
import {logger} from "better-auth";

type HonoEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    };
};

const router = new Hono<HonoEnv>();
router.use("*", requireAuth);

// GET /api/feeds - List all feeds for the logged-in user
router.get("/", async (c) => {
    const user = c.get("user");
    const status = c.req.query("status");
    const feeds = await listFeeds(user.id, status);

    return c.json({feeds});
});

// POST /api/feeds - Create a new feed for the logged-in user
router.post("/", zValidator("json", createFeedSchema), async (c) => {
        const user = c.get("user");
        const session = c.get("session");
        const body = c.req.valid("json");

        const feed = await createFeed(user.id, body);

        return c.json({user, session});
    }
);

export default router;