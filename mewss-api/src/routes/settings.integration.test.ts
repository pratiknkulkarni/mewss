import {randomUUID} from "crypto";
import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {app} from "../app.js";

const USER_EMAIL = `settings-int-${randomUUID()}@test.local`;
const PASSWORD = "TestPassword123!";

let cookie: string;

async function signUp() {
    const res = await app.fetch(
        new Request("http://localhost/api/auth/sign-up/email", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name: "Settings Int User", email: USER_EMAIL, password: PASSWORD}),
        }),
    );
    expect(res.status, `sign-up failed: ${await res.text()}`).toBe(200);
}

async function signIn(): Promise<string> {
    const res = await app.fetch(
        new Request("http://localhost/api/auth/sign-in/email", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email: USER_EMAIL, password: PASSWORD}),
        }),
    );
    expect(res.status, `sign-in failed: ${await res.text()}`).toBe(200);
    const c = res.headers.get("set-cookie");
    expect(c).not.toBeNull();
    return c!;
}

beforeAll(async () => {
    await signUp();
    cookie = await signIn();
});

afterAll(() => {
});

describe("auth guard", () => {
    it("GET /api/settings returns 401 without cookie", async () => {
        const res = await app.fetch(new Request("http://localhost/api/settings"));
        expect(res.status).toBe(401);
    });

    it("PATCH /api/settings returns 401 without cookie", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/settings", {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({theme: "dark"}),
            }),
        );
        expect(res.status).toBe(401);
    });
});

describe("GET /api/settings", () => {
    it("returns default settings for a new user with no saved row", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/settings", {
                headers: {Cookie: cookie},
            }),
        );
        expect(res.status).toBe(200);
        const {settings} = await res.json();
        expect(settings.theme).toBe("system");
        expect(settings.itemsPerPage).toBe(25);
        expect(settings.articleRetentionHours).toBeNull();
    });
});

describe("PATCH /api/settings", () => {
    async function patch(body: Record<string, unknown>) {
        return app.fetch(
            new Request("http://localhost/api/settings", {
                method: "PATCH",
                headers: {"Content-Type": "application/json", Cookie: cookie},
                body: JSON.stringify(body),
            }),
        );
    }

    it("updates theme and returns 200", async () => {
        const res = await patch({theme: "dark"});
        expect(res.status).toBe(200);
        const {settings} = await res.json();
        expect(settings.theme).toBe("dark");
    });

    it("subsequent GET reflects the persisted update", async () => {
        await patch({theme: "light"});
        const res = await app.fetch(
            new Request("http://localhost/api/settings", {headers: {Cookie: cookie}}),
        );
        const {settings} = await res.json();
        expect(settings.theme).toBe("light");
    });

    it("updates itemsPerPage", async () => {
        const res = await patch({itemsPerPage: 50});
        expect(res.status).toBe(200);
        const {settings} = await res.json();
        expect(settings.itemsPerPage).toBe(50);
    });

    it("accepts null articleRetentionHours (never expire)", async () => {
        const res = await patch({articleRetentionHours: null});
        expect(res.status).toBe(200);
        const {settings} = await res.json();
        expect(settings.articleRetentionHours).toBeNull();
    });

    it("accepts valid retention values 720/1440/2160", async () => {
        for (const hours of [720, 1440, 2160]) {
            const res = await patch({articleRetentionHours: hours});
            expect(res.status).toBe(200);
            const {settings} = await res.json();
            expect(settings.articleRetentionHours).toBe(hours);
        }
    });

    it("rejects invalid theme with 400", async () => {
        const res = await patch({theme: "purple"});
        expect(res.status).toBe(400);
    });

    it("rejects invalid itemsPerPage with 400", async () => {
        const res = await patch({itemsPerPage: 15});
        expect(res.status).toBe(400);
    });

    it("rejects invalid articleRetentionHours with 400", async () => {
        const res = await patch({articleRetentionHours: 999});
        expect(res.status).toBe(400);
    });

    it("can update multiple fields simultaneously", async () => {
        const res = await patch({theme: "dark", itemsPerPage: 100, markReadOnOpen: false});
        expect(res.status).toBe(200);
        const {settings} = await res.json();
        expect(settings.theme).toBe("dark");
        expect(settings.itemsPerPage).toBe(100);
    });
});
