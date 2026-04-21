import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";


vi.mock("../lib/scheduler-client.js", () => ({
    validateFeedUrl: vi.fn(),
}));

import { app } from "../app.js";
import { validateFeedUrl } from "../lib/scheduler-client.js";
import { SchedulerUnavailableError, UnprocessableError } from "../errors/errors.js";

const USER_A_EMAIL = `feed-test-a-${randomUUID()}@test.local`;
const USER_B_EMAIL = `feed-test-b-${randomUUID()}@test.local`;
const PASSWORD = "TestPassword123!";

let cookieA: string;
let cookieB: string;

function makeUrl() {
    return `https://example.com/feed-${randomUUID()}.xml`;
}

async function signUp(email: string) {
    const res = await app.fetch(
        new Request("http://localhost/api/auth/sign-up/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Test User", email, password: PASSWORD }),
        }),
    );
    expect(res.status, `sign-up failed for ${email}: ${await res.text()}`).toBe(200);
}

async function signIn(email: string): Promise<string> {
    const res = await app.fetch(
        new Request("http://localhost/api/auth/sign-in/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: PASSWORD }),
        }),
    );
    expect(res.status, `sign-in failed for ${email}: ${await res.text()}`).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).not.toBeNull();
    return cookie!;
}

async function createFeedRequest(cookie: string, body: Record<string, unknown>) {
    return app.fetch(
        new Request("http://localhost/api/feeds", {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(body),
        }),
    );
}

function mockValidScheduler() {
    vi.mocked(validateFeedUrl).mockResolvedValueOnce({
        title: "Test Feed",
        description: "A test feed",
    });
}

beforeAll(async () => {
    await signUp(USER_A_EMAIL);
    await signUp(USER_B_EMAIL);
    cookieA = await signIn(USER_A_EMAIL);
    cookieB = await signIn(USER_B_EMAIL);
});

afterAll(() => {
    vi.restoreAllMocks();
});
describe("auth guard", () => {
    const routes = [
        { method: "GET", path: "/api/feeds" },
        { method: "POST", path: "/api/feeds" },
        { method: "GET", path: `/api/feeds/${randomUUID()}` },
        { method: "PATCH", path: `/api/feeds/${randomUUID()}` },
        { method: "DELETE", path: `/api/feeds/${randomUUID()}` },
        { method: "POST", path: `/api/feeds/${randomUUID()}/refresh` },
    ];

    for (const { method, path } of routes) {
        it(`${method} ${path} returns 401 without cookie`, async () => {
            const res = await app.fetch(new Request(`http://localhost${path}`, { method }));
            expect(res.status).toBe(401);
        });
    }
});

describe("POST /api/feeds", () => {
    it("returns 201 with feed object including title and description from scheduler", async () => {
        mockValidScheduler();
        const res = await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        });
        expect(res.status).toBe(201);
        const body = await res.json() as any;
        expect(body.feed.title).toBe("Test Feed");
        expect(body.feed.description).toBe("A test feed");
        expect(body.feed.status).toBe("active");
        expect(body.feed.forceRefresh).toBe(true);
    });

    it("returns 400 when url is missing", async () => {
        const res = await createFeedRequest(cookieA, { refreshInterval: 3000 });
        expect(res.status).toBe(400);
    });

    it("returns 400 when refreshInterval is below minimum (5m)", async () => {
        const res = await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3,
        });
        expect(res.status).toBe(400);
    });

    it("returns 400 when refreshInterval format is invalid", async () => {
        const res = await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: "abc",
        });
        expect(res.status).toBe(400);
    });

    it("returns 422 when scheduler rejects URL as invalid RSS", async () => {
        vi.mocked(validateFeedUrl).mockRejectedValueOnce(
            new UnprocessableError("not a valid RSS feed"),
        );
        const res = await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        });
        expect(res.status).toBe(422);
        const body = await res.json() as any;
        expect(body.error.code).toBe("INVALID_FEED");
    });

    it("returns 503 when scheduler is unreachable", async () => {
        vi.mocked(validateFeedUrl).mockRejectedValueOnce(new SchedulerUnavailableError());
        const res = await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        });
        expect(res.status).toBe(503);
        const body = await res.json() as any;
        expect(body.error.code).toBe("SCHEDULER_UNAVAILABLE");
    });
});

describe("GET /api/feeds", () => {
    it("returns 200 with feeds array for authenticated user", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/feeds", {
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(Array.isArray(body.feeds)).toBe(true);
    });

    it("does not return another user's feeds", async () => {
        // Create a feed for USER_B
        mockValidScheduler();
        await createFeedRequest(cookieB, { url: makeUrl(), refreshInterval: 3000 });

        // USER_A lists — should not see USER_B's feeds
        const res = await app.fetch(
            new Request("http://localhost/api/feeds", { headers: { Cookie: cookieA } }),
        );
        const body = await res.json() as any;
        expect(body.feeds.every((f: any) => f.userId !== USER_B_EMAIL)).toBe(true);
    });

    it("filters by ?status=active", async () => {
        // Seed one active feed for USER_A
        mockValidScheduler();
        await createFeedRequest(cookieA, { url: makeUrl(), refreshInterval: 3000 });

        const res = await app.fetch(
            new Request("http://localhost/api/feeds?status=active", {
                headers: { Cookie: cookieA },
            }),
        );
        const body = await res.json() as any;
        expect(body.feeds.every((f: any) => f.status === "active")).toBe(true);
    });
});

describe("GET /api/feeds/:id", () => {
    it("returns 200 with the correct feed", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}`, {
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(body.feed.id).toBe(created.feed.id);
    });

    it("returns 404 for non-existent id", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${randomUUID()}`, {
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's feed (opaque — not 403)", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieB, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}`, {
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(404);
    });
});


describe("PATCH /api/feeds/:id", () => {
    it("updates refreshInterval and returns updated feed", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3600,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Cookie: cookieA },
                body: JSON.stringify({ refreshInterval: 3600 }),
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        // 1h = 3_600_000_000_000 ns
        expect(body.feed.refreshInterval).toBe(3_600_000_000_000);
    });

    it("updates status to paused", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Cookie: cookieA },
                body: JSON.stringify({ status: "paused" }),
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(body.feed.status).toBe("paused");
    });

    it("returns 400 for empty body", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Cookie: cookieA },
                body: JSON.stringify({}),
            }),
        );
        expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${randomUUID()}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Cookie: cookieA },
                body: JSON.stringify({ status: "paused" }),
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's feed", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieB, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Cookie: cookieA },
                body: JSON.stringify({ status: "paused" }),
            }),
        );
        expect(res.status).toBe(404);
    });
});


describe("DELETE /api/feeds/:id", () => {
    it("returns 204 and feed is no longer retrievable", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;
        const feedId = created.feed.id;

        const del = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedId}`, {
                method: "DELETE",
                headers: { Cookie: cookieA },
            }),
        );
        expect(del.status).toBe(204);

        const get = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedId}`, {
                headers: { Cookie: cookieA },
            }),
        );
        expect(get.status).toBe(404);
    });

    it("returns 404 for non-existent feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${randomUUID()}`, {
                method: "DELETE",
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's feed", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieB, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}`, {
                method: "DELETE",
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(404);
    });
});

describe("POST /api/feeds/:id/refresh", () => {
    it("returns 202 accepted", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieA, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}/refresh`, {
                method: "POST",
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(202);
    });

    it("returns 404 for non-existent feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${randomUUID()}/refresh`, {
                method: "POST",
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's feed", async () => {
        mockValidScheduler();
        const created = await (await createFeedRequest(cookieB, {
            url: makeUrl(),
            refreshInterval: 3000,
        })).json() as any;

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${created.feed.id}/refresh`, {
                method: "POST",
                headers: { Cookie: cookieA },
            }),
        );
        expect(res.status).toBe(404);
    });
});