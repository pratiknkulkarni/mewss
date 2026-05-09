import {db} from "../db/db.js";
import {userSettings} from "../db/generated/schema.js";
import {eq} from "drizzle-orm";
import type {NodePgDatabase} from "drizzle-orm/node-postgres";

type DbClient = NodePgDatabase;

export type SettingsRow = typeof userSettings.$inferSelect;
type SettingsInsert = typeof userSettings.$inferInsert;
export type SettingsUpdate = Partial<Omit<SettingsInsert, "userId">>;

export const DEFAULT_SETTINGS: Omit<SettingsRow, "userId"> = {
    theme: "system",
    itemsPerPage: 25,
    articleRetentionHours: null,
    defaultFeedView: "all",
    markReadOnOpen: true,
};

export async function getSettingsByUser(
    userId: string,
    dbClient: DbClient = db,
): Promise<SettingsRow | null> {
    const rows = await dbClient
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));
    return rows[0] ?? null;
}

// Upserts the settings row for a user. Merges updates over the stored defaults
// so a brand-new user gets sensible values on first write.
// Note: `updates` must contain at least one key (enforced by the service schema).
export async function upsertSettings(
    userId: string,
    updates: SettingsUpdate,
    dbClient: DbClient = db,
): Promise<SettingsRow> {
    const rows = await dbClient
        .insert(userSettings)
        .values({userId, ...DEFAULT_SETTINGS, ...updates})
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: updates as Partial<SettingsInsert>,
        })
        .returning();
    return rows[0];
}
