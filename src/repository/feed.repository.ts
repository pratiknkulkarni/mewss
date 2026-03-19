import {db} from "../db/db.js";
import {feed} from "../db/generated/schema.js";
import {and, eq, desc} from "drizzle-orm";


type NewFeed = typeof feed.$inferInsert;
type FeedRow = typeof feed.$inferSelect;

export async function createFeed(values: NewFeed) {
    const rows = await db.insert(feed).values(values).returning();
    console.log(rows);

    return rows[0];
}


export async function listFeedsByUser(userId: string, status?: string): Promise<FeedRow[]> {
    const conditions = [eq(feed.userId, userId)];
    if (status) conditions.push(eq(feed.status, status));

    return db
        .select()
        .from(feed)
        .where(and(...conditions))
        .orderBy(desc(feed.createdAt));
}

export async function deleteFeedByIdAndUser(id: string, userId: string): Promise<boolean> {
    const rows = await db
        .delete(feed)
        .where(and(eq(feed.id, id), eq(feed.userId, userId)))
        .returning({id: feed.id});
    return rows.length > 0;
}

export async function triggerFeedRefresh(id: string, userId: string): Promise<boolean> {
    const rows = await db
        .update(feed)
        .set({forceRefresh: true, nextFetchAfter: new Date().toISOString()})
        .where(and(eq(feed.id, id), eq(feed.userId, userId)))
        .returning({id: feed.id});
    return rows.length > 0;
}
