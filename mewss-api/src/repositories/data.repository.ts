import {db} from "../db/db.js";
import {feed, article, userArticleStates} from "../db/generated/schema.js";
import {eq, and} from "drizzle-orm";
import {randomUUID} from "node:crypto";
import type {NodePgDatabase} from "drizzle-orm/node-postgres";

type DbClient = NodePgDatabase;

export type StarredArticleRow = {
    id: string;
    title: string;
    url: string;
    author: string | null;
    publishedAt: string | null;
    summary: string | null;
    feedId: string;
    starredAt: string | null;
    content: string | null;
};

export type FeedExportRow = {
    url: string;
    title: string | null;
    description: string | null;
};

export type ImportableFeed = {
    url: string;
    title?: string;
};

// Returns all feeds for the user (url, title, description) — used for OPML export.
export async function getFeedsForExport(userId: string, dbClient: DbClient = db): Promise<FeedExportRow[]> {
    return dbClient
        .select({url: feed.url, title: feed.title, description: feed.description})
        .from(feed)
        .where(eq(feed.userId, userId));
}

// Returns all URL strings already subscribed by the user — used for import dedup.
export async function getFeedUrlsByUser(userId: string, dbClient: DbClient = db): Promise<string[]> {
    const rows = await dbClient
        .select({url: feed.url})
        .from(feed)
        .where(eq(feed.userId, userId));
    return rows.map((r) => r.url);
}

// Inserts a single new feed row during OPML import.
// Returns null if the insert fails (caller collects the error).
export async function insertImportedFeed(
    userId: string,
    {url, title}: ImportableFeed,
    dbClient: DbClient = db,
): Promise<{ id: string } | null> {
    try {
        const rows = await dbClient
            .insert(feed)
            .values({
                id: randomUUID(),
                userId,
                url,
                title: title ?? null,
                description: null,
                refreshInterval: 3_600_000_000_000,
                status: "active",
                nextFetchAfter: new Date().toISOString(),
                forceRefresh: true,
                fetchingAt: null,
                errorCount: 0,
                etag: null,
                lastModifiedHeader: null,
            })
            .returning({id: feed.id});

        return rows[0] ?? null;
    } catch {
        return null;
    }
}

// Returns all starred articles for a user via an INNER JOIN on user_article_states.
export async function getStarredArticlesByUser(userId: string, dbClient: DbClient = db): Promise<StarredArticleRow[]> {
    return dbClient
        .select({
            id: article.id,
            title: article.title,
            url: article.url,
            author: article.author,
            publishedAt: article.publishedAt,
            summary: article.summary,
            feedId: article.feedId,
            starredAt: userArticleStates.starredAt,
            content: article.content
        })
        .from(article)
        .innerJoin(
            userArticleStates,
            and(
                eq(userArticleStates.articleId, article.id),
                eq(userArticleStates.userId, userId),
                eq(userArticleStates.isStarred, true),
            ),
        )
        .where(eq(article.userId, userId));
}