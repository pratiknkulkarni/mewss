import {db} from "../db/db.js";
import {article, feed} from "../db/generated/schema.js";
import {and, eq, desc, inArray} from "drizzle-orm";
import type {NodePgDatabase} from "drizzle-orm/node-postgres";


type NewFeed = typeof feed.$inferInsert;
type FeedRow = typeof feed.$inferSelect;
export type NewArticle = typeof article.$inferInsert;

// type DbClient = typeof db; // easier to mock in the tests, no major changres required here
// type DbClient = ReturnType<typeof drizzle>;
type DbClient = NodePgDatabase;  // base type, no $client attachment

export async function insertArticle(values: NewArticle, dbClient: DbClient = db) {
    const rows = await dbClient.insert(article).values(values).returning();
    return rows[0];
}

export async function createFeed(values: NewFeed, dbClient: DbClient = db) {
    const rows = await dbClient.insert(feed).values(values).returning();

    return rows[0];
}

export async function listFeedsByUser(userId: string, status?: string, dbClient: DbClient = db): Promise<FeedRow[]> {
    const conditions = [eq(feed.userId, userId)];
    if (status) conditions.push(eq(feed.status, status));

    return dbClient
        .select()
        .from(feed)
        .where(and(...conditions))
        .orderBy(desc(feed.createdAt));
}

export async function deleteFeedByIdAndUser(id: string, userId: string, dbClient: DbClient = db): Promise<boolean> {
    const rows = await dbClient
        .delete(feed)
        .where(and(eq(feed.id, id), eq(feed.userId, userId)))
        .returning({id: feed.id});
    return rows.length > 0;
}

export async function triggerFeedRefresh(id: string, userId: string, dbClient: DbClient = db): Promise<boolean> {
    const rows = await dbClient
        .update(feed)
        .set({forceRefresh: true, nextFetchAfter: new Date().toISOString(), updatedAt: new Date().toISOString()})
        .where(and(eq(feed.id, id), eq(feed.userId, userId)))
        .returning({id: feed.id});
    return rows.length > 0;
}

export async function findFeedByIdAndUser(id: string, userId: string, dbClient: DbClient = db): Promise<FeedRow | null> {
    const rows = await dbClient
        .select()
        .from(feed)
        .where(and(eq(feed.id, id), eq(feed.userId, userId)));
    return rows[0] ?? null;
}

export async function findFeedsByIdsAndUser(
    ids: string[],
    userId: string,
    dbClient: DbClient = db,
): Promise<FeedRow[]> {
    return dbClient
        .select()
        .from(feed)
        .where(and(inArray(feed.id, ids), eq(feed.userId, userId)));
}

export async function updateFeed(
    id: string,
    userId: string,
    updates: Partial<Pick<NewFeed, "refreshInterval" | "status" | "nextFetchAfter">>,
    dbClient: DbClient = db,
): Promise<FeedRow | null> {
    const rows = await dbClient
        .update(feed)
        .set({...updates, updatedAt: new Date().toISOString()})
        .where(and(eq(feed.id, id), eq(feed.userId, userId)))
        .returning();
    return rows[0] ?? null;
}

