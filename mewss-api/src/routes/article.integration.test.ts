import {randomUUID} from "crypto";
import {beforeAll, describe, expect, it, vi} from "vitest";

vi.mock("../lib/scheduler-client.js", () => ({
    validateFeedUrl: vi.fn(),
}));

import {app} from "../app.js";
import {validateFeedUrl} from "../lib/scheduler-client.js";
import {insertArticle} from "../repositories/feed.repository.js";
import {db} from "../db/db.js";

const USER_A_EMAIL = `article-test-a-${randomUUID()}@test.local`;
const USER_B_EMAIL = `article-test-b-${randomUUID()}@test.local`;
const PASSWORD = "TestPassword123!";

let cookieA: string;
let cookieB: string;

let feedAId: string;
let feedBId: string;
let articleAId: string;

function makeUrl() {
    return `https://example.com/feed-${randomUUID()}.xml`;
}

async function signUp(email: string) {
    const res = await app.fetch(
        new Request("http://localhost/api/auth/sign-up/email", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name: "Test", email, password: PASSWORD}),
        }),
    );
    expect(res.status, `sign-up failed: ${await res.text()}`).toBe(200);
}

async function signIn(email: string): Promise<string> {
    const res = await app.fetch(
        new Request("http://localhost/api/auth/sign-in/email", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password: PASSWORD}),
        }),
    );
    expect(res.status, `sign-in failed: ${await res.text()}`).toBe(200);
    return res.headers.get("set-cookie")!;
}

async function createFeedViaApi(cookie: string): Promise<string> {
    vi.mocked(validateFeedUrl).mockResolvedValueOnce({title: "Feed", description: ""});
    const res = await app.fetch(
        new Request("http://localhost/api/feeds", {
            method: "POST",
            headers: {"Content-Type": "application/json", Cookie: cookie},
            body: JSON.stringify({url: makeUrl(), refreshInterval: 3000}),
        }),
    );
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    return body.feed.id;
}

function makeArticleValues(feedId: string, userId: string) {
    return {
        feedId,
        userId,
        title: "Article " + randomUUID(),
        url: `https://example.com/article-${randomUUID()}`,
        identityHash: randomUUID().replace(/-/g, ""),
        publishedAt: new Date().toISOString(),
    };
}

beforeAll(async () => {
    await signUp(USER_A_EMAIL);
    await signUp(USER_B_EMAIL);
    cookieA = await signIn(USER_A_EMAIL);
    cookieB = await signIn(USER_B_EMAIL);

    const sessionResA = await app.fetch(
        new Request("http://localhost/api/auth/get-session", {
            headers: {Cookie: cookieA},
        }),
    );
    const sessionA = await sessionResA.json() as any;
    const userAId = sessionA.user.id;

    const sessionResB = await app.fetch(
        new Request("http://localhost/api/auth/get-session", {
            headers: {Cookie: cookieB},
        }),
    );
    const sessionB = await sessionResB.json() as any;
    const userBId = sessionB.user.id;

    feedAId = await createFeedViaApi(cookieA);
    feedBId = await createFeedViaApi(cookieB);

    const articleA = await insertArticle(makeArticleValues(feedAId, userAId), db);
    articleAId = articleA!.id;

    await insertArticle(makeArticleValues(feedAId, userAId), db);

    await insertArticle(makeArticleValues(feedBId, userBId), db);
});

describe("auth guard", () => {
    const routes = [
        {method: "GET", path: `/api/feeds/${randomUUID()}/articles`},
        {method: "GET", path: "/api/articles"},
        {method: "GET", path: `/api/articles/${randomUUID()}`},
        {method: "PATCH", path: `/api/articles/${randomUUID()}/read`},
        {method: "PATCH", path: `/api/articles/${randomUUID()}/unread`},
        {method: "POST", path: `/api/feeds/${randomUUID()}/articles/read-all`},
        {method: "POST", path: `/api/feeds/${randomUUID()}/articles/unread-all`},
        {method: "POST", path: "/api/articles/read-all"},
        {method: "POST", path: "/api/feeds/bulk-read"},
        {method: "POST", path: "/api/feeds/bulk-unread"},
    ];

    for (const {method, path} of routes) {
        it(`${method} ${path} returns 401 without cookie`, async () => {
            const res = await app.fetch(new Request(`http://localhost${path}`, {method}));
            expect(res.status).toBe(401);
        });
    }
});

describe("GET /api/feeds/:feedId/articles", () => {
    it("returns 200 with articles and pagination shape", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedAId}/articles`, {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(Array.isArray(body.articles)).toBe(true);
        expect(body.articles.length).toBeGreaterThanOrEqual(1);
        expect(body.pagination).toMatchObject({
            page: 1,
            limit: 20,
        });
        expect(typeof body.pagination.total).toBe("number");
        expect(typeof body.pagination.hasMore).toBe("boolean");
    });

    it("articles have isRead field defaulting to false", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedAId}/articles`, {
                headers: {Cookie: cookieA},
            }),
        );
        const body = await res.json() as any;
        expect(body.articles.every((a: any) => typeof a.isRead === "boolean")).toBe(true);
    });

    it("respects ?limit and ?page query params", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedAId}/articles?limit=1&page=1`, {
                headers: {Cookie: cookieA},
            }),
        );
        const body = await res.json() as any;
        expect(body.articles).toHaveLength(1);
        expect(body.pagination.limit).toBe(1);
    });

    it("returns 404 for non-existent feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${randomUUID()}/articles`, {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's feed (opaque)", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedBId}/articles`, {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });

    it("?unread=true filters to unread articles", async () => {
        await app.fetch(
            new Request(`http://localhost/api/articles/${articleAId}/read`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedAId}/articles?unread=true`, {
                headers: {Cookie: cookieA},
            }),
        );
        const body = await res.json() as any;
        expect(body.articles.every((a: any) => a.isRead === false)).toBe(true);
    });
});
describe("GET /api/articles", () => {
    it("returns 200 with articles across all feeds", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/articles", {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(Array.isArray(body.articles)).toBe(true);
        expect(body.pagination).toBeDefined();
    });

    it("does not return another user's articles", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/articles", {
                headers: {Cookie: cookieA},
            }),
        );
        const body = await res.json() as any;
        expect(body.articles.every((a: any) => a.feedId !== feedBId)).toBe(true);
    });

    it("?feedId filter narrows to a specific feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/articles?feedId=${feedAId}`, {
                headers: {Cookie: cookieA},
            }),
        );
        const body = await res.json() as any;
        expect(body.articles.every((a: any) => a.feedId === feedAId)).toBe(true);
    });
});
describe("PATCH /api/articles/:id/read", () => {
    it("returns 200 with updated article where isRead=true", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${articleAId}/read`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(body.article.isRead).toBe(true);
        expect(body.article.readAt).not.toBeNull();
    });

    it("returns 404 for non-existent article", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${randomUUID()}/read`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's article (opaque)", async () => {
        const feedBArticles = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedBId}/articles`, {
                headers: {Cookie: cookieB},
            }),
        );
        const feedBBody = await feedBArticles.json() as any;
        const bArticleId = feedBBody.articles[0]?.id;

        if (!bArticleId) return;

        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${bArticleId}/read`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });
});

describe("POST /api/feeds/:feedId/articles/read-all", () => {
    it("returns 200 with updatedCount", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedAId}/articles/read-all`, {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(typeof body.updatedCount).toBe("number");
    });

    it("returns 404 for non-existent feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${randomUUID()}/articles/read-all`, {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedBId}/articles/read-all`, {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });
});

describe("POST /api/articles/read-all", () => {
    it("returns 200 with updatedCount", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/articles/read-all", {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(typeof body.updatedCount).toBe("number");
    });

    it("does not affect another user's articles", async () => {
        await app.fetch(
            new Request("http://localhost/api/articles/read-all", {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );

        const res = await app.fetch(
            new Request("http://localhost/api/articles?unread=true", {
                headers: {Cookie: cookieB},
            }),
        );
        const body = await res.json() as any;
        expect(body.pagination.total).toBeGreaterThanOrEqual(1);
    });
});

describe("GET /api/articles/:id", () => {
    it("returns 200 with the article", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${articleAId}`, {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(body.article.id).toBe(articleAId);
        expect(typeof body.article.isRead).toBe("boolean");
    });

    it("returns 404 for non-existent article", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${randomUUID()}`, {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's article (opaque)", async () => {
        const bArticles = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedBId}/articles`, {
                headers: {Cookie: cookieB},
            }),
        );
        const bBody = await bArticles.json() as any;
        const bArticleId = bBody.articles[0]?.id;
        if (!bArticleId) return;

        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${bArticleId}`, {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });
});

describe("PATCH /api/articles/:id/unread", () => {
    it("returns 200 with isRead=false after reverting a read article", async () => {
        // First mark as read
        await app.fetch(
            new Request(`http://localhost/api/articles/${articleAId}/read`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );

        // Then revert
        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${articleAId}/unread`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(body.article.isRead).toBe(false);
        expect(body.article.readAt).toBeNull();
    });

    it("returns 404 for non-existent article", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${randomUUID()}/unread`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's article", async () => {
        const bArticles = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedBId}/articles`, {
                headers: {Cookie: cookieB},
            }),
        );
        const bBody = await bArticles.json() as any;
        const bArticleId = bBody.articles[0]?.id;
        if (!bArticleId) return;

        const res = await app.fetch(
            new Request(`http://localhost/api/articles/${bArticleId}/unread`, {
                method: "PATCH",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });
});

describe("POST /api/feeds/:feedId/articles/unread-all", () => {
    it("returns 200 with updatedCount", async () => {
        // Mark all as read first
        await app.fetch(
            new Request(`http://localhost/api/feeds/${feedAId}/articles/read-all`, {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );

        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedAId}/articles/unread-all`, {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(typeof body.updatedCount).toBe("number");
    });

    it("returns 404 for non-existent feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${randomUUID()}/articles/unread-all`, {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 404 for another user's feed", async () => {
        const res = await app.fetch(
            new Request(`http://localhost/api/feeds/${feedBId}/articles/unread-all`, {
                method: "POST",
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(404);
    });
});

describe("POST /api/feeds/bulk-read", () => {
    it("returns 200 with updatedCount for owned feeds", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/feeds/bulk-read", {
                method: "POST",
                headers: {"Content-Type": "application/json", Cookie: cookieA},
                body: JSON.stringify({feedIds: [feedAId]}),
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(typeof body.updatedCount).toBe("number");
    });

    it("returns 404 when any feedId belongs to another user", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/feeds/bulk-read", {
                method: "POST",
                headers: {"Content-Type": "application/json", Cookie: cookieA},
                body: JSON.stringify({feedIds: [feedAId, feedBId]}),
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 400 when feedIds array is empty", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/feeds/bulk-read", {
                method: "POST",
                headers: {"Content-Type": "application/json", Cookie: cookieA},
                body: JSON.stringify({feedIds: []}),
            }),
        );
        expect(res.status).toBe(400);
    });
});

describe("POST /api/feeds/bulk-unread", () => {
    it("returns 200 with updatedCount for owned feeds", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/feeds/bulk-unread", {
                method: "POST",
                headers: {"Content-Type": "application/json", Cookie: cookieA},
                body: JSON.stringify({feedIds: [feedAId]}),
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(typeof body.updatedCount).toBe("number");
    });

    it("returns 404 when any feedId belongs to another user", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/feeds/bulk-unread", {
                method: "POST",
                headers: {"Content-Type": "application/json", Cookie: cookieA},
                body: JSON.stringify({feedIds: [feedBId]}),
            }),
        );
        expect(res.status).toBe(404);
    });

    it("returns 400 when feedIds array is empty", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/feeds/bulk-unread", {
                method: "POST",
                headers: {"Content-Type": "application/json", Cookie: cookieA},
                body: JSON.stringify({feedIds: []}),
            }),
        );
        expect(res.status).toBe(400);
    });
});