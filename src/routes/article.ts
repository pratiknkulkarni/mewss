import {auth} from "../lib/auth.js";
import {requireAuth} from "../middleware/auth.js";
import {Hono} from "hono";
import {
    bulkFeedActionSchema,
    listArticlesForFeed,
    listArticlesGlobal,
    listArticlesGlobalSchema,
    listArticlesSchema, markAllArticlesRead, markArticleRead, markFeedArticlesRead,
    markFeedArticlesUnread, markFeedsBulkRead,
    markFeedsBulkUnread
} from "../services/article.service.js";
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

// GET /api/articles — global inbox across ALL feeds
router.get("/articles", zValidator("query", listArticlesGlobalSchema), async (c) => {
    const user = c.get("user");
    const query = c.req.valid("query");

    const result = await listArticlesGlobal(user.id, query);

    return c.json(result);
});

// PATCH /api/articles/:id/read — mark a single article as read
router.patch("/articles/:id/read", async (c) => {
    const user = c.get("user");
    const article = await markArticleRead(c.req.param("id"), user.id);
    return c.json({article});
});

// POST /api/feeds/:feedId/articles/read-all — mark ALL articles IN A FEED as read
router.post("/feeds/:feedId/articles/read-all", async (c) => {
    const user = c.get("user");
    const result = await markFeedArticlesRead(c.req.param("feedId"), user.id);
    return c.json(result);
});

// POST /api/articles/read-all — mark ALL articles for the user as read
router.post("/articles/read-all", async (c) => {
    const user = c.get("user");
    const result = await markAllArticlesRead(user.id);
    return c.json(result);
});

// POST /api/feeds/:feedId/articles/unread-all — revert all articles in a feed to unread
router.post("/feeds/:feedId/articles/unread-all", async (c) => {
    const user = c.get("user");
    const result = await markFeedArticlesUnread(c.req.param("feedId"), user.id);
    return c.json(result);
});

// POST /api/articles/read-all — mark all articles for the user as read
router.post("/articles/read-all", async (c) => {
    const user = c.get("user");
    const result = await markAllArticlesRead(user.id);
    return c.json(result);
});

// POST /api/feeds/bulk-read — mark all articles in selected feeds as read
router.post("/feeds/bulk-read", zValidator("json", bulkFeedActionSchema), async (c) => {
    const user = c.get("user");
    const {feedIds} = c.req.valid("json");
    const result = await markFeedsBulkRead(feedIds, user.id);
    return c.json(result);
});

// POST /api/feeds/bulk-unread — revert all articles in selected feeds to unread
router.post("/feeds/bulk-unread", zValidator("json", bulkFeedActionSchema), async (c) => {
    const user = c.get("user");
    const {feedIds} = c.req.valid("json");
    const result = await markFeedsBulkUnread(feedIds, user.id);
    return c.json(result);
});

export default router;