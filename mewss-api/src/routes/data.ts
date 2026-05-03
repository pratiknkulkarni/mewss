import {Hono} from "hono";
import {requireAuth} from "../middleware/auth.js";
import {auth} from "../lib/auth.js";
import {zValidator} from "@hono/zod-validator";
import {z} from "zod";
import {buildOpmlForUser, buildStarredCsv, getStarredArticles, importOpmlForUser} from "../services/data.service.js";

type HonoEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    };
};

const router = new Hono<HonoEnv>();
router.use("*", requireAuth);

// GET /api/export/opml
router.get("/export/opml", async (c) => {
    const user = c.get("user");
    const opml = await buildOpmlForUser(user.id);

    return new Response(opml, {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Content-Disposition": `attachment; filename="mewss-subscriptions-${dateSuffix()}.opml"`,
        },
    });
});

// POST /api/import/opml  (multipart/form-data, field name: "file")
router.post("/import/opml", async (c) => {
    const user = c.get("user");

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
        return c.json({error: "Missing OPML file in 'file' form field"}, 400);
    }

    const text = await (file as File).text();

    if (!text.trim()) {
        return c.json({error: "Uploaded file is empty"}, 400);
    }

    const result = await importOpmlForUser(text, user.id);

    if (result.imported === 0 && result.skipped === 0 && result.errors.length === 0) {
        return c.json({error: "No valid RSS <outline> entries found in OPML"}, 422);
    }

    return c.json(result, 200);
});

// GET /api/export/starred?format=json (default) | csv
const starredExportSchema = z.object({
    format: z.enum(["json", "csv"]).default("json"),
});

router.get("/export/starred", zValidator("query", starredExportSchema), async (c) => {
    const user = c.get("user");
    const {format} = c.req.valid("query");

    const articles = await getStarredArticles(user.id);
    const suffix = dateSuffix();

    if (format === "csv") {
        return new Response(buildStarredCsv(articles), {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="mewss-starred-${suffix}.csv"`,
            },
        });
    }

    return new Response(JSON.stringify({exported: articles.length, articles}, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="mewss-starred-${suffix}.json"`,
        },
    });
});

function dateSuffix() {
    return new Date().toISOString().slice(0, 10);
}

export default router;