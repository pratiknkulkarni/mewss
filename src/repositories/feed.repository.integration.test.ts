import {randomUUID} from "crypto";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {Pool, type PoolClient,} from "pg";
import {user} from "../db/generated/schema.js";
import {
    createFeed,
    deleteFeedByIdAndUser,
    findFeedByIdAndUser,
    listFeedsByUser,
    triggerFeedRefresh,
} from "./feed.repository.js";
import {drizzle} from "drizzle-orm/node-postgres";
import type {NodePgDatabase} from "drizzle-orm/node-postgres";

let pool: Pool;
let client: PoolClient;
// let txDb: ReturnType<typeof drizzle>;
let txDb: NodePgDatabase;


const USER_A = "test-user-a-" + randomUUID();
const USER_B = "test-user-b-" + randomUUID();

beforeEach(async () => {
    pool = new Pool({connectionString: process.env.DATABASE_URL});
    client = await pool.connect();
    await client.query("BEGIN");
    // txDb = drizzle(client);
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

function makeFeed(userId: string, overrides: Record<string, unknown> = {}) {
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
        ...overrides,
    };
}

function makeArticle(feedId: string, userId: string) {
    return {
        feedId,
        userId,
        title: "Test Article",
        url: `https://example.com/article-${randomUUID()}`,
        identityHash: randomUUID().replace(/-/g, ""),
    };
}

describe("createFeed", () => {
    it("inserts a feed and returns the created row", async () => {
        const values = makeFeed(USER_A);
        const row = await createFeed(values, txDb);

        expect(row.id).toBe(values.id);
        expect(row.userId).toBe(USER_A);
        expect(row.url).toBe(values.url);
        expect(row.status).toBe("active");
    });

    it("throws Postgres 23505 on duplicate (user_id, url)", async () => {
        const values = makeFeed(USER_A, {url: "https://example.com/same.xml"});
        await createFeed(values, txDb);

        await expect(
            createFeed({...values, id: randomUUID()}, txDb),
        ).rejects.toMatchObject({cause: {code: "23505"}});
    });
});

describe("listFeedsByUser", () => {
    it("returns only the requesting user's feeds", async () => {
        await createFeed(makeFeed(USER_A), txDb);
        await createFeed(makeFeed(USER_B), txDb);

        const results = await listFeedsByUser(USER_A, undefined, txDb);

        expect(results).toHaveLength(1);
        expect(results[0].userId).toBe(USER_A);
    });

    it("returns empty array when user has no feeds", async () => {
        expect(await listFeedsByUser(USER_A, undefined, txDb)).toHaveLength(0);
    });

    it("orders by created_at DESC (newest first)", async () => {
        const now = Date.now();
        await createFeed(makeFeed(USER_A, {createdAt: new Date(now - 2000).toISOString()}), txDb);
        await createFeed(makeFeed(USER_A, {createdAt: new Date(now).toISOString()}), txDb);
        await createFeed(makeFeed(USER_A, {createdAt: new Date(now - 1000).toISOString()}), txDb);

        const results = await listFeedsByUser(USER_A, undefined, txDb);
        const times = results.map((r) => new Date(r.createdAt!).getTime());

        expect(times[0]).toBeGreaterThan(times[1]);
        expect(times[1]).toBeGreaterThan(times[2]);
    });

    it("filters by status=active", async () => {
        await createFeed(makeFeed(USER_A, {status: "active"}), txDb);
        await createFeed(makeFeed(USER_A, {status: "paused"}), txDb);

        const results = await listFeedsByUser(USER_A, "active", txDb);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe("active");
    });

    it("filters by status=paused", async () => {
        await createFeed(makeFeed(USER_A, {status: "active"}), txDb);
        await createFeed(makeFeed(USER_A, {status: "paused"}), txDb);

        const results = await listFeedsByUser(USER_A, "paused", txDb);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe("paused");
    });
});

describe("findFeedByIdAndUser", () => {
    it("returns the feed when id and userId match", async () => {
        const values = makeFeed(USER_A);
        await createFeed(values, txDb);

        const result = await findFeedByIdAndUser(values.id, USER_A, txDb);

        expect(result).not.toBeNull();
        expect(result!.id).toBe(values.id);
    });

    // this one => feed with ID present but not belonging to the current user
    it("returns null when id exists but belongs to a different user", async () => {
        const values = makeFeed(USER_B);
        await createFeed(values, txDb);

        const result = await findFeedByIdAndUser(values.id, USER_A, txDb);

        expect(result).toBeNull();
    });

    it("returns null when id does not exist", async () => {
        expect(await findFeedByIdAndUser(randomUUID(), USER_A, txDb)).toBeNull();
    });
});

describe("deleteFeedByIdAndUser", () => {
    it("deletes the feed and returns true", async () => {
        const values = makeFeed(USER_A);
        await createFeed(values, txDb);

        expect(await deleteFeedByIdAndUser(values.id, USER_A, txDb)).toBe(true);
        expect(await findFeedByIdAndUser(values.id, USER_A, txDb)).toBeNull();
    });

    it("returns false when feed belongs to a different user — does not delete it", async () => {
        const values = makeFeed(USER_B);
        await createFeed(values, txDb);

        expect(await deleteFeedByIdAndUser(values.id, USER_A, txDb)).toBe(false);
        expect(await findFeedByIdAndUser(values.id, USER_B, txDb)).not.toBeNull();
    });

    it("returns false when feed does not exist", async () => {
        expect(await deleteFeedByIdAndUser(randomUUID(), USER_A, txDb)).toBe(false);
    });

});

describe("triggerFeedRefresh", () => {
    it("sets force_refresh=true and returns true", async () => {
        const values = makeFeed(USER_A, {forceRefresh: false});
        await createFeed(values, txDb);

        expect(await triggerFeedRefresh(values.id, USER_A, txDb)).toBe(true);

        const updated = await findFeedByIdAndUser(values.id, USER_A, txDb);
        expect(updated!.forceRefresh).toBe(true);
    });

    it("returns false when feed belongs to a different user", async () => {
        const values = makeFeed(USER_B);
        await createFeed(values, txDb);

        expect(await triggerFeedRefresh(values.id, USER_A, txDb)).toBe(false);
    });

    it("returns false when feed does not exist", async () => {
        expect(await triggerFeedRefresh(randomUUID(), USER_A, txDb)).toBe(false);
    });
});