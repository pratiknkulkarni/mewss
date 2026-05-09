import {Hono} from "hono";
import {requireAuth} from "../middleware/auth.js";
import {auth} from "../lib/auth.js";
import {zValidator} from "@hono/zod-validator";
import {
    getSettings,
    updateSettings,
    updateSettingsSchema,
} from "../services/settings.service.js";

type HonoEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    };
};

const router = new Hono<HonoEnv>();
router.use("*", requireAuth);

// GET /api/settings — returns the user's settings (defaults if none saved yet)
router.get("/", async (c) => {
    const user = c.get("user");
    const settings = await getSettings(user.id);
    return c.json({settings});
});

// PATCH /api/settings — partially updates the user's settings
router.patch("/", zValidator("json", updateSettingsSchema), async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const settings = await updateSettings(user.id, body);
    return c.json({settings});
});

export default router;
