import {createMiddleware} from "hono/factory";
import {auth} from "../lib/auth.js";
import {createLogger} from "../lib/logger.js";

type HonoEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    }
};

export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
    const log = createLogger("middleware.auth");
    const sessionData = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!sessionData) {
        // TODO: make this a centralized error handling and unauthorised error
        log.warn({path: c.req.path}, "unauthenticated request rejected");
        return c.json({error: "Unauthorized"}, 401)
    }

    c.set("user", sessionData.user);
    c.set("session", sessionData.session);
    await next();
});