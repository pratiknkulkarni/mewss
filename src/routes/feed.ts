import {Hono} from "hono";
import {requireAuth} from "../middleware/auth.js";
import {auth} from "../lib/auth.js";
import {createFeed, createFeedSchema, deleteFeed, listFeeds, refreshFeed} from "../services/feed.service.js";
import {zValidator} from "@hono/zod-validator";

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

        //TODO: do something with this feed please
        const feed = await createFeed(user.id, body);

        return c.json({user, session});
    }
);

// DELETE /api/feeds/:id
router.delete("/:id", async (c) => {
    const user = c.get("user");
    await deleteFeed(c.req.param("id"), user.id);
    return c.body(null, 204);
});

// POST /api/feeds/refresh/:id - sets force_refresh=true
router.post("/refresh/:id", async (c) => {
    const user = c.get("user");
    await refreshFeed(c.req.param("id"), user.id);
    return c.json({message: "Feed refresh queued"}, 202);
});

export default router;