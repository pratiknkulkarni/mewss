// TESTS GENERATED USING Claude
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../repositories/data.repository.js", () => ({
    getFeedsForExport: vi.fn(),
    getFeedUrlsByUser: vi.fn(),
    insertImportedFeed: vi.fn(),
    getStarredArticlesByUser: vi.fn(),
}));

import * as dataRepo from "../repositories/data.repository.js";
import {
    buildOpmlForUser,
    parseOpmlUrls,
    importOpmlForUser,
    buildStarredCsv,
} from "./data.service.js";
import type {StarredArticleRow} from "../repositories/data.repository.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeStarredRow(overrides: Partial<StarredArticleRow> = {}): StarredArticleRow {
    return {
        id: "article-1",
        title: "Test Article",
        url: "https://example.com/post-1",
        author: "Ada Lovelace",
        publishedAt: "2024-01-15T10:00:00Z",
        summary: "A short summary.",
        content: "<p>Full article content here.</p>",
        feedId: "feed-1",
        starredAt: "2024-01-16T08:00:00Z",
        ...overrides,
    };
}

// ─── parseOpmlUrls ────────────────────────────────────────────────────────────
// Pure function — no mocks needed.

describe("parseOpmlUrls", () => {
    it("returns an empty array for an OPML with no <outline> entries", () => {
        const opml = `<?xml version="1.0"?><opml version="2.0"><head/><body/></opml>`;
        expect(parseOpmlUrls(opml)).toEqual([]);
    });

    it("parses a single flat outline entry", () => {
        const opml = `<opml><body>
            <outline type="rss" text="HN" xmlUrl="https://news.ycombinator.com/rss"/>
        </body></opml>`;
        const result = parseOpmlUrls(opml);
        expect(result).toHaveLength(1);
        expect(result[0].url).toBe("https://news.ycombinator.com/rss");
        expect(result[0].title).toBe("HN");
    });

    it("parses multiple flat entries", () => {
        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://a.com/rss"/>
            <outline type="rss" xmlUrl="https://b.com/rss"/>
        </body></opml>`;
        expect(parseOpmlUrls(opml)).toHaveLength(2);
    });

    it("flattens folder groups (outline containers without xmlUrl are skipped)", () => {
        const opml = `<opml><body>
            <outline text="Tech">
                <outline type="rss" xmlUrl="https://a.com/rss"/>
                <outline type="rss" xmlUrl="https://b.com/rss"/>
            </outline>
        </body></opml>`;
        const result = parseOpmlUrls(opml);
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.url)).toEqual([
            "https://a.com/rss",
            "https://b.com/rss",
        ]);
    });

    it("discards entries with malformed xmlUrl values", () => {
        const opml = `<opml><body>
            <outline type="rss" xmlUrl="not-a-url"/>
            <outline type="rss" xmlUrl="https://valid.com/rss"/>
        </body></opml>`;
        const result = parseOpmlUrls(opml);
        expect(result).toHaveLength(1);
        expect(result[0].url).toBe("https://valid.com/rss");
    });

    it("uses 'text' attribute as title fallback when 'title' is absent", () => {
        const opml = `<opml><body>
            <outline type="rss" text="Fallback Title" xmlUrl="https://x.com/rss"/>
        </body></opml>`;
        const result = parseOpmlUrls(opml);
        expect(result[0].title).toBe("Fallback Title");
    });

    it("title is undefined when neither 'title' nor 'text' is present", () => {
        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://x.com/rss"/>
        </body></opml>`;
        expect(parseOpmlUrls(opml)[0].title).toBeUndefined();
    });

    it("handles duplicate xmlUrls by returning both (dedup is the service's job)", () => {
        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://x.com/rss"/>
            <outline type="rss" xmlUrl="https://x.com/rss"/>
        </body></opml>`;
        expect(parseOpmlUrls(opml)).toHaveLength(2);
    });
});

// ─── buildOpmlForUser ─────────────────────────────────────────────────────────

describe("buildOpmlForUser", () => {
    beforeEach(() => vi.resetAllMocks());

    it("calls getFeedsForExport with the correct userId", async () => {
        vi.mocked(dataRepo.getFeedsForExport).mockResolvedValueOnce([]);
        await buildOpmlForUser("user-1");
        expect(dataRepo.getFeedsForExport).toHaveBeenCalledWith("user-1");
    });

    it("returns a valid OPML envelope even with no feeds", async () => {
        vi.mocked(dataRepo.getFeedsForExport).mockResolvedValueOnce([]);
        const result = await buildOpmlForUser("user-1");
        expect(result).toContain('<?xml version="1.0"');
        expect(result).toContain("<opml");
        expect(result).toContain("<body>");
        expect(result).not.toContain("<outline");
    });

    it("includes each feed's xmlUrl in the OPML body", async () => {
        vi.mocked(dataRepo.getFeedsForExport).mockResolvedValueOnce([
            {url: "https://a.com/rss", title: "Feed A", description: null},
            {url: "https://b.com/rss", title: "Feed B", description: null},
        ]);
        const result = await buildOpmlForUser("user-1");
        expect(result).toContain('xmlUrl="https://a.com/rss"');
        expect(result).toContain('xmlUrl="https://b.com/rss"');
    });

    it("falls back to the hostname when a feed has no title", async () => {
        vi.mocked(dataRepo.getFeedsForExport).mockResolvedValueOnce([
            {url: "https://example.com/rss", title: null, description: null},
        ]);
        const result = await buildOpmlForUser("user-1");
        expect(result).toContain("example.com");
    });

    it("includes the description attribute when present", async () => {
        vi.mocked(dataRepo.getFeedsForExport).mockResolvedValueOnce([
            {url: "https://a.com/rss", title: "A", description: "great feed"},
        ]);
        const result = await buildOpmlForUser("user-1");
        expect(result).toContain('description="great feed"');
    });

    it("XML-escapes special characters in titles", async () => {
        vi.mocked(dataRepo.getFeedsForExport).mockResolvedValueOnce([
            {url: "https://a.com/rss", title: 'Feed <A> & "B"', description: null},
        ]);
        const result = await buildOpmlForUser("user-1");
        expect(result).toContain("Feed &lt;A&gt; &amp; &quot;B&quot;");
        expect(result).not.toContain('Feed <A>');
    });
});

// ─── importOpmlForUser ────────────────────────────────────────────────────────

describe("importOpmlForUser", () => {
    beforeEach(() => vi.resetAllMocks());

    it("returns { imported:0, skipped:0, errors:[] } when OPML has no outlines", async () => {
        vi.mocked(dataRepo.getFeedUrlsByUser).mockResolvedValueOnce([]);
        const result = await importOpmlForUser(
            `<opml><body/></opml>`,
            "user-1",
        );
        expect(result).toEqual({imported: 0, skipped: 0, errors: []});
        expect(dataRepo.insertImportedFeed).not.toHaveBeenCalled();
    });

    it("inserts a new feed and returns imported:1", async () => {
        vi.mocked(dataRepo.getFeedUrlsByUser).mockResolvedValueOnce([]);
        vi.mocked(dataRepo.insertImportedFeed).mockResolvedValueOnce({id: "new-feed"});

        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://new.com/rss"/>
        </body></opml>`;

        const result = await importOpmlForUser(opml, "user-1");
        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(0);
        expect(result.errors).toHaveLength(0);
    });

    it("skips URLs already in the user's subscriptions", async () => {
        vi.mocked(dataRepo.getFeedUrlsByUser).mockResolvedValueOnce(
            ["https://existing.com/rss"]
        );

        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://existing.com/rss"/>
        </body></opml>`;

        const result = await importOpmlForUser(opml, "user-1");
        expect(result.imported).toBe(0);
        expect(dataRepo.insertImportedFeed).not.toHaveBeenCalled();
    });

    it("deduplicates URLs within the same OPML — imports first, skips second", async () => {
        vi.mocked(dataRepo.getFeedUrlsByUser).mockResolvedValueOnce([]);
        vi.mocked(dataRepo.insertImportedFeed).mockResolvedValueOnce({id: "feed-1"});

        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://dup.com/rss"/>
            <outline type="rss" xmlUrl="https://dup.com/rss"/>
        </body></opml>`;

        const result = await importOpmlForUser(opml, "user-1");
        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(1);
        expect(result.imported + result.skipped).toBe(2);
        expect(dataRepo.insertImportedFeed).toHaveBeenCalledTimes(1);
    });

    it("records a URL in errors when insertImportedFeed returns null", async () => {
        vi.mocked(dataRepo.getFeedUrlsByUser).mockResolvedValueOnce([]);
        vi.mocked(dataRepo.insertImportedFeed).mockResolvedValueOnce(null);

        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://fail.com/rss"/>
        </body></opml>`;

        const result = await importOpmlForUser(opml, "user-1");
        expect(result.errors).toContain("https://fail.com/rss");
        expect(result.imported).toBe(0);
    });

    it("handles a mix of new, duplicate, and failing URLs in one import", async () => {
        vi.mocked(dataRepo.getFeedUrlsByUser).mockResolvedValueOnce(
            ["https://existing.com/rss"],
        );
        vi.mocked(dataRepo.insertImportedFeed)
            .mockResolvedValueOnce({id: "feed-new"}) // new → imported
            .mockResolvedValueOnce(null);              // fail → error

        const opml = `<opml><body>
            <outline type="rss" xmlUrl="https://existing.com/rss"/>
            <outline type="rss" xmlUrl="https://new.com/rss"/>
            <outline type="rss" xmlUrl="https://fail.com/rss"/>
        </body></opml>`;

        const result = await importOpmlForUser(opml, "user-1");
        expect(result.imported).toBe(1);
        expect(result.errors).toEqual(["https://fail.com/rss"]);
    });
});

// ─── buildStarredCsv ─────────────────────────────────────────────────────────
// Pure function — no mocks needed.

describe("buildStarredCsv", () => {
    it("returns only the header row for an empty array", () => {
        const result = buildStarredCsv([]);
        expect(result.trim()).toBe("id,title,url,author,publishedAt,content,summary,feedId,starredAt");
    });

    it("header columns are in the correct order", () => {
        const header = buildStarredCsv([]).split("\r\n")[0];
        expect(header).toBe("id,title,url,author,publishedAt,content,summary,feedId,starredAt");
    });

    it("produces one data row per article", () => {
        const rows = [makeStarredRow(), makeStarredRow({id: "article-2"})];
        const lines = buildStarredCsv(rows).split("\r\n");
        expect(lines).toHaveLength(3); // header + 2 rows
    });

    it("data row contains the article id in the first column", () => {
        const row = makeStarredRow({id: "abc-123"});
        const lines = buildStarredCsv([row]).split("\r\n");
        expect(lines[1].startsWith("abc-123,")).toBe(true);
    });

    it("null fields are rendered as empty strings", () => {
        const row = makeStarredRow({author: null, summary: null, content: null, starredAt: null});
        const csv = buildStarredCsv([row]);
        // Should not contain literal "null"
        expect(csv).not.toContain("null");
    });

    it("wraps values containing commas in double quotes", () => {
        const row = makeStarredRow({title: "Hello, World"});
        const csv = buildStarredCsv([row]);
        expect(csv).toContain('"Hello, World"');
    });

    it("escapes double quotes inside values per RFC 4180", () => {
        const row = makeStarredRow({title: 'She said "hello"'});
        const csv = buildStarredCsv([row]);
        expect(csv).toContain('"She said ""hello"""');
    });

    it("wraps values containing newlines in double quotes", () => {
        const row = makeStarredRow({summary: "line1\nline2"});
        const csv = buildStarredCsv([row]);
        expect(csv).toContain('"line1\nline2"');
    });
});