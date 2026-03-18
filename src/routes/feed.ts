import {Hono} from "hono";
import {requireAuth} from "../middleware/auth.js";
import {auth} from "../lib/auth.js";
import {createFeed, createFeedSchema} from "../services/feed.service.js";
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
    const session = c.get("session");

    return c.json({user, session});
});

// POST /api/feeds - Create a new feed for the logged-in user
router.post("/", zValidator("json", createFeedSchema), async (c) => {
        const user = c.get("user");
        const session = c.get("session");
        const body = c.req.valid("json");

        const feed = await createFeed(user.id, body);

        console.log(" FEED ADDED => ")
        console.log(feed);
        console.log("<= FEED ADDED ")

        return c.json({user, session});
    }
)
;

export default router;