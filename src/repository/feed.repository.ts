import {db} from "../db/db.js";
import {feed} from "../db/generated/schema.js";

type NewFeed = typeof feed.$inferInsert;

export async function createFeed(values: NewFeed) {
    const rows = await db.insert(feed).values(values).returning();
    console.log(rows);

    return rows[0];
}
