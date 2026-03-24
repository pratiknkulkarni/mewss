import {randomUUID} from "crypto";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {Pool, type PoolClient} from "pg";
import {drizzle} from "drizzle-orm/node-postgres";
import type {NodePgDatabase} from "drizzle-orm/node-postgres";
import {user} from "../db/generated/schema.js";
import {createFeed, insertArticle} from "./feed.repository.js";
import {
    countArticlesByFeedAndUser,
    countArticlesGlobal,
    findArticleByIdAndUser,
    listArticlesByFeed,
    listArticlesGlobal,
    markAllArticlesAsRead,
    markAllArticlesAsReadForFeeds,
    markAllArticlesAsReadGlobal,
    markAllArticlesAsUnread,
    markAllArticlesAsUnreadForFeeds,
    markAllArticlesAsUnreadGlobal,
    markArticleAsRead,
    markArticleAsUnread,
} from "./article.repository.js";

let pool: Pool;
let client: PoolClient;
let txDb: NodePgDatabase;

const USER_A = "article-test-user-a-" + randomUUID();
const USER_B = "article-test-user-b-" + randomUUID();

beforeEach(async () => {
    pool = new Pool({connectionString: process.env.DATABASE_URL});
    client = await pool.connect();
    await client.query("BEGIN");
    txDb = drizzle(client) as unknown as NodePgDatabase;

    const now = new Date().toISOString();
    await txDb.insert(user).values([
        {
            id: USER_A,
            name: "User A",
            email: `${USER_A}@test.local`,
            emailVerified: false,
            createdAt: now,
            updatedAt: now
        },
        {
            id: USER_B,
            name: "User B",
            email: `${USER_B}@test.local`,
            emailVerified: false,
            createdAt: now,
            updatedAt: now
        },
    ]);
});

afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
});

function makeFeed(userId: string) {
    const now = new Date().toISOString();
    return {
        id: randomUUID(),
        userId,
        url: `https://example.com/feed-${randomUUID()}.xml`,
        refreshInterval: 1_800_000_000_000,
        forceRefresh: false,
        nextFetchAfter: now,
        createdAt: now,
        updatedAt: now,
    };
}

function makeArticle(feedId: string, userId: string, overrides: Record<string, unknown> = {}) {
    return {
        feedId,
        userId,
        title: "Test Article " + randomUUID(),
        url: `https://example.com/article-${randomUUID()}`,
        identityHash: randomUUID().replace(/-/g, ""),
        publishedAt: new Date().toISOString(),
        ...overrides,
    };
}

describe("listArticlesByFeed", () => {
    it("returns articles for the correct feed and user", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        const results = await listArticlesByFeed(f.id, USER_A, {page: 1, limit: 20, unread: false}, txDb);
        expect(results).toHaveLength(2);
    });

    it("defaults isRead to false when no state row exists", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        const results = await listArticlesByFeed(f.id, USER_A, {page: 1, limit: 20, unread: false}, txDb);
        expect(results[0].isRead).toBe(false);
        expect(results[0].readAt).toBeNull();
    });

    it("applies article.user_id filter — USER_A cannot see USER_B articles in same feed", async () => {
        // Simulate a feed owned by USER_B that somehow has USER_A's user_id
        // on the article (not possible in practice, but confirms the filter works)
        const f = makeFeed(USER_B);
        await createFeed(f, txDb);
        await insertArticle(makeArticle(f.id, USER_B), txDb);

        const results = await listArticlesByFeed(f.id, USER_A, {page: 1, limit: 20, unread: false}, txDb);
        expect(results).toHaveLength(0);
    });

    it("filters unread articles correctly", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a1 = await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        // Mark first article as read
        await markArticleAsRead(a1!.id, USER_A, txDb);

        const unread = await listArticlesByFeed(f.id, USER_A, {page: 1, limit: 20, unread: true}, txDb);
        expect(unread).toHaveLength(1);
        expect(unread[0].isRead).toBe(false);
    });

    it("respects pagination limit and offset", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        for (let i = 0; i < 5; i++) {
            await insertArticle(makeArticle(f.id, USER_A), txDb);
        }

        const page1 = await listArticlesByFeed(f.id, USER_A, {page: 1, limit: 3, unread: false}, txDb);
        const page2 = await listArticlesByFeed(f.id, USER_A, {page: 2, limit: 3, unread: false}, txDb);

        expect(page1).toHaveLength(3);
        expect(page2).toHaveLength(2);
        // No overlap between pages
        const page1Ids = new Set(page1.map(a => a.id));
        expect(page2.every(a => !page1Ids.has(a.id))).toBe(true);
    });
});

describe("countArticlesByFeedAndUser", () => {
    it("returns total count for the feed", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        expect(await countArticlesByFeedAndUser(f.id, USER_A, {}, txDb)).toBe(2);
    });

    it("returns unread count when unread=true", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a1 = await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        await markArticleAsRead(a1!.id, USER_A, txDb);

        expect(await countArticlesByFeedAndUser(f.id, USER_A, {unread: true}, txDb)).toBe(1);
    });
});


describe("listArticlesGlobal", () => {
    it("returns articles across all feeds for the user", async () => {
        const f1 = makeFeed(USER_A);
        const f2 = makeFeed(USER_A);
        await createFeed(f1, txDb);
        await createFeed(f2, txDb);
        await insertArticle(makeArticle(f1.id, USER_A), txDb);
        await insertArticle(makeArticle(f2.id, USER_A), txDb);

        const results = await listArticlesGlobal(USER_A, {page: 1, limit: 20}, txDb);
        expect(results).toHaveLength(2);
    });

    it("does not return another user's articles", async () => {
        const f = makeFeed(USER_B);
        await createFeed(f, txDb);
        await insertArticle(makeArticle(f.id, USER_B), txDb);

        const results = await listArticlesGlobal(USER_A, {page: 1, limit: 20}, txDb);
        expect(results).toHaveLength(0);
    });

    it("filters by feedId when provided", async () => {
        const f1 = makeFeed(USER_A);
        const f2 = makeFeed(USER_A);
        await createFeed(f1, txDb);
        await createFeed(f2, txDb);
        await insertArticle(makeArticle(f1.id, USER_A), txDb);
        await insertArticle(makeArticle(f2.id, USER_A), txDb);

        const results = await listArticlesGlobal(USER_A, {page: 1, limit: 20, feedId: f1.id}, txDb);
        expect(results).toHaveLength(1);
        expect(results[0].feedId).toBe(f1.id);
    });

    it("filters unread only", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a1 = await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        await markArticleAsRead(a1!.id, USER_A, txDb);

        const unread = await listArticlesGlobal(USER_A, {page: 1, limit: 20, unread: true}, txDb);
        expect(unread).toHaveLength(1);
    });
});


describe("markArticleAsRead", () => {
    it("creates a state row and returns article with isRead=true", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_A), txDb);

        const result = await markArticleAsRead(a!.id, USER_A, txDb);
        expect(result).not.toBeNull();
        expect(result!.isRead).toBe(true);
        expect(result!.readAt).not.toBeNull();
    });

    it("is idempotent — marking already-read article does not error", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_A), txDb);

        await markArticleAsRead(a!.id, USER_A, txDb);
        const result = await markArticleAsRead(a!.id, USER_A, txDb);
        expect(result!.isRead).toBe(true);
    });

    it("returns null for non-existent article", async () => {
        const result = await markArticleAsRead(randomUUID(), USER_A, txDb);
        expect(result).toBeNull();
    });

    it("returns null for another user's article (opaque 404)", async () => {
        const f = makeFeed(USER_B);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_B), txDb);

        const result = await markArticleAsRead(a!.id, USER_A, txDb);
        expect(result).toBeNull();
    });
});

describe("markAllArticlesAsRead", () => {
    it("marks all articles in the feed as read and returns correct count", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        const count = await markAllArticlesAsRead(f.id, USER_A, txDb);
        expect(count).toBe(3);

        const unread = await countArticlesByFeedAndUser(f.id, USER_A, {unread: true}, txDb);
        expect(unread).toBe(0);
    });

    it("returns 0 when feed has no articles", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);

        expect(await markAllArticlesAsRead(f.id, USER_A, txDb)).toBe(0);
    });

    it("does not affect another user's articles in a different feed", async () => {
        const fA = makeFeed(USER_A);
        const fB = makeFeed(USER_B);
        await createFeed(fA, txDb);
        await createFeed(fB, txDb);
        await insertArticle(makeArticle(fA.id, USER_A), txDb);
        await insertArticle(makeArticle(fB.id, USER_B), txDb);

        await markAllArticlesAsRead(fA.id, USER_A, txDb);

        // USER_B's article in their own feed remains unread
        const bUnread = await countArticlesByFeedAndUser(fB.id, USER_B, {unread: true}, txDb);
        expect(bUnread).toBe(1);
    });
});

describe("markAllArticlesAsReadGlobal", () => {
    it("marks all articles for the user across all feeds", async () => {
        const f1 = makeFeed(USER_A);
        const f2 = makeFeed(USER_A);
        await createFeed(f1, txDb);
        await createFeed(f2, txDb);
        await insertArticle(makeArticle(f1.id, USER_A), txDb);
        await insertArticle(makeArticle(f2.id, USER_A), txDb);

        const count = await markAllArticlesAsReadGlobal(USER_A, txDb);
        expect(count).toBe(2);

        const unread = await countArticlesGlobal(USER_A, {unread: true}, txDb);
        expect(unread).toBe(0);
    });

    it("does not affect another user's articles", async () => {
        const fA = makeFeed(USER_A);
        const fB = makeFeed(USER_B);
        await createFeed(fA, txDb);
        await createFeed(fB, txDb);
        await insertArticle(makeArticle(fA.id, USER_A), txDb);
        await insertArticle(makeArticle(fB.id, USER_B), txDb);

        await markAllArticlesAsReadGlobal(USER_A, txDb);

        const bUnread = await countArticlesGlobal(USER_B, {unread: true}, txDb);
        expect(bUnread).toBe(1);
    });

    it("returns 0 when user has no articles", async () => {
        expect(await markAllArticlesAsReadGlobal(USER_A, txDb)).toBe(0);
    });
});

describe("findArticleByIdAndUser", () => {
    it("returns the article with isRead=false when no state row exists", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_A), txDb);

        const result = await findArticleByIdAndUser(a!.id, USER_A, txDb);
        expect(result).not.toBeNull();
        expect(result!.isRead).toBe(false);
    });

    it("returns null for another user's article", async () => {
        const f = makeFeed(USER_B);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_B), txDb);

        expect(await findArticleByIdAndUser(a!.id, USER_A, txDb)).toBeNull();
    });

    it("returns null for non-existent article", async () => {
        expect(await findArticleByIdAndUser(randomUUID(), USER_A, txDb)).toBeNull();
    });
});

describe("markArticleAsUnread", () => {
    it("reverts a read article to unread", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_A), txDb);

        await markArticleAsRead(a!.id, USER_A, txDb);
        const reverted = await markArticleAsUnread(a!.id, USER_A, txDb);

        expect(reverted!.isRead).toBe(false);
        expect(reverted!.readAt).toBeNull();
    });

    it("is a no-op when article is already unread (no state row)", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_A), txDb);

        // Never marked as read — calling unread is safe
        const result = await markArticleAsUnread(a!.id, USER_A, txDb);
        expect(result!.isRead).toBe(false);
    });

    it("returns null for another user's article", async () => {
        const f = makeFeed(USER_B);
        await createFeed(f, txDb);
        const a = await insertArticle(makeArticle(f.id, USER_B), txDb);

        expect(await markArticleAsUnread(a!.id, USER_A, txDb)).toBeNull();
    });
});

describe("markAllArticlesAsUnread", () => {
    it("reverts all read articles in a feed to unread", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);
        await insertArticle(makeArticle(f.id, USER_A), txDb);

        await markAllArticlesAsRead(f.id, USER_A, txDb);
        expect(await countArticlesByFeedAndUser(f.id, USER_A, {unread: true}, txDb)).toBe(0);

        const count = await markAllArticlesAsUnread(f.id, USER_A, txDb);
        expect(count).toBe(2);
        expect(await countArticlesByFeedAndUser(f.id, USER_A, {unread: true}, txDb)).toBe(2);
    });

    it("returns 0 when feed has no articles", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        expect(await markAllArticlesAsUnread(f.id, USER_A, txDb)).toBe(0);
    });
});

describe("markAllArticlesAsUnreadGlobal", () => {
    it("reverts all articles across all feeds to unread", async () => {
        const f1 = makeFeed(USER_A);
        const f2 = makeFeed(USER_A);
        await createFeed(f1, txDb);
        await createFeed(f2, txDb);
        await insertArticle(makeArticle(f1.id, USER_A), txDb);
        await insertArticle(makeArticle(f2.id, USER_A), txDb);

        await markAllArticlesAsReadGlobal(USER_A, txDb);
        const count = await markAllArticlesAsUnreadGlobal(USER_A, txDb);
        expect(count).toBe(2);

        const unread = await countArticlesGlobal(USER_A, {unread: true}, txDb);
        expect(unread).toBe(2);
    });

    it("does not affect another user's articles", async () => {
        const fA = makeFeed(USER_A);
        const fB = makeFeed(USER_B);
        await createFeed(fA, txDb);
        await createFeed(fB, txDb);
        await insertArticle(makeArticle(fA.id, USER_A), txDb);
        await insertArticle(makeArticle(fB.id, USER_B), txDb);

        // Mark both users' articles as read, then revert only USER_A
        await markAllArticlesAsReadGlobal(USER_A, txDb);
        await markAllArticlesAsReadGlobal(USER_B, txDb);
        await markAllArticlesAsUnreadGlobal(USER_A, txDb);

        // USER_B's article should still be read
        expect(await countArticlesGlobal(USER_B, {unread: true}, txDb)).toBe(0);
    });
});

describe("markAllArticlesAsReadForFeeds", () => {
    it("marks articles across multiple feeds as read", async () => {
        const f1 = makeFeed(USER_A);
        const f2 = makeFeed(USER_A);
        await createFeed(f1, txDb);
        await createFeed(f2, txDb);
        await insertArticle(makeArticle(f1.id, USER_A), txDb);
        await insertArticle(makeArticle(f2.id, USER_A), txDb);

        const count = await markAllArticlesAsReadForFeeds([f1.id, f2.id], USER_A, txDb);
        expect(count).toBe(2);
        expect(await countArticlesGlobal(USER_A, {unread: true}, txDb)).toBe(0);
    });

    it("ignores feeds belonging to another user", async () => {
        const fA = makeFeed(USER_A);
        const fB = makeFeed(USER_B);
        await createFeed(fA, txDb);
        await createFeed(fB, txDb);
        await insertArticle(makeArticle(fA.id, USER_A), txDb);
        await insertArticle(makeArticle(fB.id, USER_B), txDb);

        // Pass both feed IDs but only USER_A's articles should be marked
        await markAllArticlesAsReadForFeeds([fA.id, fB.id], USER_A, txDb);

        // USER_B's article remains unread
        expect(await countArticlesGlobal(USER_B, {unread: true}, txDb)).toBe(1);
    });

    it("returns 0 for empty feeds", async () => {
        const f = makeFeed(USER_A);
        await createFeed(f, txDb);
        expect(await markAllArticlesAsReadForFeeds([f.id], USER_A, txDb)).toBe(0);
    });
});

describe("markAllArticlesAsUnreadForFeeds", () => {
    it("reverts articles across multiple feeds to unread", async () => {
        const f1 = makeFeed(USER_A);
        const f2 = makeFeed(USER_A);
        await createFeed(f1, txDb);
        await createFeed(f2, txDb);
        await insertArticle(makeArticle(f1.id, USER_A), txDb);
        await insertArticle(makeArticle(f2.id, USER_A), txDb);

        await markAllArticlesAsReadForFeeds([f1.id, f2.id], USER_A, txDb);
        const count = await markAllArticlesAsUnreadForFeeds([f1.id, f2.id], USER_A, txDb);
        expect(count).toBe(2);
        expect(await countArticlesGlobal(USER_A, {unread: true}, txDb)).toBe(2);
    });
});
