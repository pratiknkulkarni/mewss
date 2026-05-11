import {db} from "../db/db.js";
import {eq} from "drizzle-orm";
import type {NodePgDatabase} from "drizzle-orm/node-postgres";
import {settings} from "../db/generated/schema.js";

type DbClient = NodePgDatabase;

export type SettingsRow = typeof settings.$inferSelect;
type SettingsInsert = typeof settings.$inferInsert;
export type SettingsUpdate = Partial<Omit<SettingsInsert, "userId">>;

export const DEFAULT_SETTINGS: Omit<SettingsRow, "userId"> = {
    theme: "system",
    itemsPerPage: 25,
    articleRetentionHours: null,
};

export async function getSettingsByUser(
    userId: string,
    dbClient: DbClient = db,
): Promise<SettingsRow | null> {
    const rows = await dbClient
        .select()
        .from(settings)
        .where(eq(settings.userId, userId));
    return rows[0] ?? null;
}

export async function upsertSettings(
    userId: string,
    updates: SettingsUpdate,
    dbClient: DbClient = db,
): Promise<SettingsRow> {
    const rows = await dbClient
        .insert(settings)
        .values({userId, ...DEFAULT_SETTINGS, ...updates})
        .onConflictDoUpdate({
            target: settings.userId,
            set: updates as Partial<SettingsInsert>,
        })
        .returning();
    return rows[0];
}
