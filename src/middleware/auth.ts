import {createMiddleware} from "hono/factory";
import {auth} from "../lib/auth.js";

type HonoEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    }
};

export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
    const sessionData = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!sessionData) {
        // TODO: make this a centralized error handling and unauthorised error
        return
    }

    c.set("user", sessionData.user);
    c.set("session", sessionData.session);
    await next();
});