// TESTS GENERATED USING Claude

import {randomUUID} from "crypto";
import {beforeAll, describe, expect, it, vi} from "vitest";

vi.mock("../lib/scheduler-client.js", () => ({
    validateFeedUrl: vi.fn(),
}));

import {app} from "../app.js";
import {validateFeedUrl} from "../lib/scheduler-client.js";
import {insertArticle} from "../repositories/feed.repository.js";
import {db} from "../db/db.js";

// ─── Test users ───────────────────────────────────────────────────────────────

const USER_A_EMAIL = `data-test-a-${randomUUID()}@test.local`;
const USER_B_EMAIL = `data-test-b-${randomUUID()}@test.local`;
const PASSWORD = "TestPassword123!";

let cookieA: string;
let cookieB: string;
let userAId: string;

let feedAId: string;
let articleAId: string; // unstarred by default
let starredArticleId: string;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function getSession(cookie: string): Promise<{ user: { id: string } }> {
    const res = await app.fetch(
        new Request("http://localhost/api/auth/get-session", {
            headers: {Cookie: cookie},
        }),
    );
    return res.json() as any;
}

async function createFeedViaApi(cookie: string, url = makeUrl()): Promise<string> {
    vi.mocked(validateFeedUrl).mockResolvedValueOnce({title: "Test Feed", description: "desc"});
    const res = await app.fetch(
        new Request("http://localhost/api/feeds", {
            method: "POST",
            headers: {"Content-Type": "application/json", Cookie: cookie},
            body: JSON.stringify({url, refreshInterval: 3600}),
        }),
    );
    const body = await res.json() as any;                          // read once
    expect(res.status, `createFeed failed: ${JSON.stringify(body)}`).toBe(201);
    return body.feed.id;
}

function makeArticleValues(feedId: string, userId: string) {
    return {
        feedId,
        userId,
        title: `Article ${randomUUID()}`,
        url: `https://example.com/article-${randomUUID()}`,
        identityHash: randomUUID().replace(/-/g, ""),
        publishedAt: new Date().toISOString(),
    };
}

async function starArticle(articleId: string, cookie: string) {
    const res = await app.fetch(
        new Request(`http://localhost/api/articles/${articleId}/star`, {
            method: "PATCH",
            headers: {Cookie: cookie},
        }),
    );
    expect(res.status, `star failed: ${await res.text()}`).toBe(200);
}

function makeOpml(entries: Array<{ url: string; title?: string }>) {
    const outlines = entries
        .map(({url, title}) =>
            `<outline type="rss" text="${title ?? "Feed"}" title="${title ?? "Feed"}" xmlUrl="${url}"/>`,
        )
        .join("\n        ");
    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
    <head><title>test</title></head>
    <body>
        ${outlines}
    </body>
</opml>`;
}

function opmlFormData(opmlString: string, filename = "subs.opml") {
    const form = new FormData();
    form.append("file", new Blob([opmlString], {type: "text/xml"}), filename);
    return form;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
    await signUp(USER_A_EMAIL);
    await signUp(USER_B_EMAIL);
    cookieA = await signIn(USER_A_EMAIL);
    cookieB = await signIn(USER_B_EMAIL);

    const sessionA = await getSession(cookieA);
    userAId = sessionA.user.id;

    // User B gets a feed too (for isolation checks)
    await createFeedViaApi(cookieB);

    // User A: one feed, two articles (one starred, one not)
    feedAId = await createFeedViaApi(cookieA);

    const articleA = await insertArticle(makeArticleValues(feedAId, userAId), db);
    articleAId = articleA!.id;

    const articleB = await insertArticle(makeArticleValues(feedAId, userAId), db);
    starredArticleId = articleB!.id;
    await starArticle(starredArticleId, cookieA);
});

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe("auth guard", () => {
    const routes = [
        {method: "GET", path: "/api/export/opml"},
        {method: "POST", path: "/api/import/opml"},
        {method: "GET", path: "/api/export/starred"},
    ];

    for (const {method, path} of routes) {
        it(`${method} ${path} returns 401 without a session cookie`, async () => {
            const res = await app.fetch(new Request(`http://localhost${path}`, {method}));
            expect(res.status).toBe(401);
        });
    }
});

// ─── GET /api/export/opml ─────────────────────────────────────────────────────

describe("GET /api/export/opml", () => {
    it("returns 200 with Content-Type text/xml", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/opml", {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("text/xml");
    });

    it("sets a Content-Disposition attachment header with .opml filename", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/opml", {
                headers: {Cookie: cookieA},
            }),
        );
        const disposition = res.headers.get("content-disposition") ?? "";
        expect(disposition).toContain("attachment");
        expect(disposition).toContain(".opml");
    });

    it("body is valid OPML XML containing the user's feed URL", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/opml", {
                headers: {Cookie: cookieA},
            }),
        );
        const body = await res.text();
        expect(body).toContain('<?xml version="1.0"');
        expect(body).toContain("<opml");
        expect(body).toContain("xmlUrl=");
        // The feed we created must appear
        const feedsRes = await app.fetch(
            new Request("http://localhost/api/feeds", {headers: {Cookie: cookieA}}),
        );
        const {feeds} = (await feedsRes.json()) as any;
        for (const f of feeds) {
            expect(body).toContain(f.url);
        }
    });

    it("does not include other users' feed URLs", async () => {
        // Get User B's feed urls
        const feedsBRes = await app.fetch(
            new Request("http://localhost/api/feeds", {headers: {Cookie: cookieB}}),
        );
        const {feeds: feedsB} = (await feedsBRes.json()) as any;

        const res = await app.fetch(
            new Request("http://localhost/api/export/opml", {
                headers: {Cookie: cookieA},
            }),
        );
        const body = await res.text();
        for (const f of feedsB) {
            expect(body).not.toContain(f.url);
        }
    });

    it("returns a well-formed OPML body even when the user has no feeds", async () => {
        // User B was set up with one feed, but let's use a brand-new user
        const freshEmail = `data-empty-${randomUUID()}@test.local`;
        await signUp(freshEmail);
        const freshCookie = await signIn(freshEmail);

        const res = await app.fetch(
            new Request("http://localhost/api/export/opml", {
                headers: {Cookie: freshCookie},
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.text();
        expect(body).toContain("<opml");
        expect(body).toContain("<body>");
        // No outlines
        expect(body).not.toContain("<outline");
    });
});

// ─── POST /api/import/opml ────────────────────────────────────────────────────

describe("POST /api/import/opml", () => {
    it("returns 400 when no file field is present", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/import/opml", {
                method: "POST",
                headers: {Cookie: cookieA},
                body: new FormData(), // empty form
            }),
        );
        expect(res.status).toBe(400);
    });

    it("returns 422 when the OPML contains no valid <outline> entries", async () => {
        const emptyOpml = `<?xml version="1.0"?><opml version="2.0"><head/><body/></opml>`;
        const res = await app.fetch(
            new Request("http://localhost/api/import/opml", {
                method: "POST",
                headers: {Cookie: cookieA},
                body: opmlFormData(emptyOpml),
            }),
        );
        expect(res.status).toBe(422);
    });

    it("returns 200 with { imported, skipped, errors } on a valid OPML", async () => {
        const newUrl = makeUrl();
        const opml = makeOpml([{url: newUrl, title: "Import Test Feed"}]);

        const res = await app.fetch(
            new Request("http://localhost/api/import/opml", {
                method: "POST",
                headers: {Cookie: cookieA},
                body: opmlFormData(opml),
            }),
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as any;
        expect(body.imported).toBeGreaterThanOrEqual(1);
        expect(typeof body.skipped).toBe("number");
        expect(Array.isArray(body.errors)).toBe(true);
    });

    it("skips duplicate URLs that the user already has", async () => {
        // feedAId's URL is already in User A's subscriptions
        const feedsRes = await app.fetch(
            new Request("http://localhost/api/feeds", {headers: {Cookie: cookieA}}),
        );
        const {feeds} = (await feedsRes.json()) as any;
        const existingUrl = feeds[0].url;

        const opml = makeOpml([{url: existingUrl}]);
        const res = await app.fetch(
            new Request("http://localhost/api/import/opml", {
                method: "POST",
                headers: {Cookie: cookieA},
                body: opmlFormData(opml),
            }),
        );
        const body = (await res.json()) as any;
        expect(body.skipped).toBeGreaterThanOrEqual(1);
        expect(body.imported).toBe(0);
    });

    it("flattens OPML folder groups and imports the nested feeds", async () => {
        const url1 = makeUrl();
        const url2 = makeUrl();
        // OPML with a folder wrapper containing two feeds
        const folderOpml = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>grouped</title></head>
  <body>
    <outline text="Tech">
      <outline type="rss" text="Feed 1" xmlUrl="${url1}"/>
      <outline type="rss" text="Feed 2" xmlUrl="${url2}"/>
    </outline>
  </body>
</opml>`;

        const res = await app.fetch(
            new Request("http://localhost/api/import/opml", {
                method: "POST",
                headers: {Cookie: cookieB},
                body: opmlFormData(folderOpml),
            }),
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as any;
        expect(body.imported).toBe(2);
    });

    it("does not import feeds into another user's account", async () => {
        const url = makeUrl();
        // Import for User A
        await app.fetch(
            new Request("http://localhost/api/import/opml", {
                method: "POST",
                headers: {Cookie: cookieA},
                body: opmlFormData(makeOpml([{url}])),
            }),
        );
        // User B should not have it
        const feedsBRes = await app.fetch(
            new Request("http://localhost/api/feeds", {headers: {Cookie: cookieB}}),
        );
        const {feeds} = (await feedsBRes.json()) as any;
        expect(feeds.every((f: any) => f.url !== url)).toBe(true);
    });

    it("handles duplicate URLs within a single OPML file (imports only once)", async () => {
        const url = makeUrl();
        const opml = makeOpml([{url}, {url}]); // same URL twice

        const res = await app.fetch(
            new Request("http://localhost/api/import/opml", {
                method: "POST",
                headers: {Cookie: cookieA},
                body: opmlFormData(opml),
            }),
        );
        const body = (await res.json()) as any;
        // imported + skipped must sum to 2, but only 1 row in DB
        expect(body.imported + body.skipped).toBe(2);
        expect(body.imported).toBe(1);
    });
});

// ─── GET /api/export/starred ──────────────────────────────────────────────────

describe("GET /api/export/starred — JSON (default)", () => {
    it("returns 200 with Content-Type application/json", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/json");
    });

    it("sets a Content-Disposition attachment with .json filename", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieA},
            }),
        );
        const disposition = res.headers.get("content-disposition") ?? "";
        expect(disposition).toContain("attachment");
        expect(disposition).toContain(".json");
    });

    it("body contains { exported, articles } with only starred articles", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieA},
            }),
        );
        const body = (await res.json()) as any;
        expect(typeof body.exported).toBe("number");
        expect(Array.isArray(body.articles)).toBe(true);
        // starredArticleId must be present; unstarred articleAId must not
        const ids = body.articles.map((a: any) => a.id);
        expect(ids).toContain(starredArticleId);
        expect(ids).not.toContain(articleAId);
    });

    it("exported count matches articles array length", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieA},
            }),
        );
        const body = (await res.json()) as any;
        expect(body.exported).toBe(body.articles.length);
    });

    it("returns empty articles array when the user has no starred articles", async () => {
        // User B has no starred articles
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieB},
            }),
        );
        const body = (await res.json()) as any;
        expect(body.exported).toBe(0);
        expect(body.articles).toHaveLength(0);
    });

    it("does not return another user's starred articles", async () => {
        const aRes = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieA},
            }),
        );
        const aBody = (await aRes.json()) as any;
        const aIds = aBody.articles.map((a: any) => a.id);

        const bRes = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieB},
            }),
        );
        const bBody = (await bRes.json()) as any;
        const bIds = bBody.articles.map((a: any) => a.id);

        for (const id of bIds) {
            expect(aIds).not.toContain(id);
        }
    });

    it("each article has the expected shape", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred", {
                headers: {Cookie: cookieA},
            }),
        );
        const body = (await res.json()) as any;
        for (const a of body.articles) {
            expect(a).toHaveProperty("id");
            expect(a).toHaveProperty("title");
            expect(a).toHaveProperty("url");
            expect(a).toHaveProperty("feedId");
            expect(a).toHaveProperty("starredAt");
            expect(a).toHaveProperty("content");
            expect(a).toHaveProperty("summary");
        }
    });
});

describe("GET /api/export/starred — CSV (?format=csv)", () => {
    it("returns 200 with Content-Type text/csv", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred?format=csv", {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("text/csv");
    });

    it("sets a Content-Disposition attachment with .csv filename", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred?format=csv", {
                headers: {Cookie: cookieA},
            }),
        );
        const disposition = res.headers.get("content-disposition") ?? "";
        expect(disposition).toContain("attachment");
        expect(disposition).toContain(".csv");
    });

    it("body starts with the expected CSV header row", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred?format=csv", {
                headers: {Cookie: cookieA},
            }),
        );
        const text = await res.text();
        const firstLine = text.split("\r\n")[0];
        expect(firstLine).toBe("id,title,url,author,publishedAt,content,summary,feedId,starredAt");
    });

    it("starred article ID appears in the CSV body", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred?format=csv", {
                headers: {Cookie: cookieA},
            }),
        );
        const text = await res.text();
        expect(text).toContain(starredArticleId);
        expect(text).not.toContain(articleAId);
    });

    it("returns only the header row when there are no starred articles", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred?format=csv", {
                headers: {Cookie: cookieB},
            }),
        );
        const text = await res.text();
        // Only the header, no extra rows
        expect(text.trim()).toBe("id,title,url,author,publishedAt,content,summary,feedId,starredAt");
    });

    it("returns 400 for an invalid format value", async () => {
        const res = await app.fetch(
            new Request("http://localhost/api/export/starred?format=xml", {
                headers: {Cookie: cookieA},
            }),
        );
        expect(res.status).toBe(400);
    });
});