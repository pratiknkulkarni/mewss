import {auth} from "../lib/auth.js";
import {requireAuth} from "../middleware/auth.js";
import {Hono} from "hono";
import {listArticlesForFeed, listArticlesSchema} from "../services/article.service.js";
import {zValidator} from "@hono/zod-validator";

type HonoEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    };
};

const router = new Hono<HonoEnv>();
router.use("*", requireAuth);

// GET /api/feeds/:feedId/articles — paginated articles for a specific feed
router.get("/feeds/:feedId/articles", zValidator("query", listArticlesSchema), async (c) => {
    const user = c.get("user");
    const query = c.req.valid("query");

    const result = await listArticlesForFeed(c.req.param("feedId"), user.id, query);

    return c.json(result);
});

export default router;