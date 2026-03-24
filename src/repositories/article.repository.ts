import type {NodePgDatabase} from "drizzle-orm/node-postgres";
import {article, userArticleStates} from "../db/generated/schema.js";
import {and, eq, getTableColumns, isNull, sql} from "drizzle-orm";
import {db} from "../db/db.js";
import type {listArticlesSchema} from "../services/article.service.js";
import {z} from "zod";

type DbClient = NodePgDatabase;

// type Article = typeof article.$inferSelect;

export type ArticleWithReadState = typeof article.$inferSelect & {
    isRead: boolean;
    readAt: string | null;
};

export interface ListOptions {
    page: number;
    limit: number;
    unread?: boolean;
}

export interface GlobalListOptions extends ListOptions {
    feedId?: string;
}

// helper
function buildArticleSelect(userId: string, dbClient: DbClient) {
    return dbClient
        .select({
            ...getTableColumns(article),
            isRead: sql<boolean>`COALESCE(
            ${userArticleStates.isRead},
            false
            )`,
            readAt: userArticleStates.readAt,
        })
        .from(article)
        .leftJoin(
            userArticleStates,
            and(
                eq(userArticleStates.articleId, article.id),
                eq(userArticleStates.userId, userId),
            ),
        );
}

export async function listArticlesByFeed(feedId: string, userId: string,
                                         query: z.infer<typeof listArticlesSchema>,
                                         // page: number,
                                         // limit: number,
                                         // unread?: boolean,
                                         dbClient: DbClient = db): Promise<ArticleWithReadState[]> {

    const {page, limit, unread} = query;
    const offset = (page - 1) * limit;

    const conditions = [
        eq(article.feedId, feedId),
        eq(article.userId, userId),
    ];

    if (unread) {
        conditions.push(isNull(userArticleStates.readAt))
    }

    return buildArticleSelect(userId, dbClient)
        .where(and(...conditions))
        .orderBy(sql`${article.publishedAt}
        DESC NULLS LAST`).limit(limit).offset(offset) as Promise<ArticleWithReadState[]>;
}

export async function countArticlesByFeedAndUser(
    feedId: string,
    userId: string,
    options: { unread?: boolean },
    dbClient: DbClient = db,
): Promise<number> {
    const conditions = [
        eq(article.feedId, feedId),
        eq(article.userId, userId),
    ];

    if (options.unread) {
        const result = await dbClient
            .select({count: sql<number>`count(*)::int`})
            .from(article)
            .leftJoin(
                userArticleStates,
                and(
                    eq(userArticleStates.articleId, article.id),
                    eq(userArticleStates.userId, userId),
                ),
            )
            .where(and(...conditions, isNull(userArticleStates.readAt)));
        return result[0]?.count ?? 0;
    }

    const result = await dbClient
        .select({count: sql<number>`count(*)::int`})
        .from(article)
        .where(and(...conditions));
    return result[0]?.count ?? 0;
}

export async function listArticlesGlobal(
    userId: string,
    options: GlobalListOptions,
    dbClient: DbClient = db,
): Promise<ArticleWithReadState[]> {
    const {page, limit, unread, feedId} = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(article.userId, userId)];
    if (feedId) conditions.push(eq(article.feedId, feedId));
    if (unread) conditions.push(isNull(userArticleStates.readAt));

    return buildArticleSelect(userId, dbClient)
        .where(and(...conditions))
        .orderBy(sql`${article.publishedAt}
        DESC NULLS LAST`)
        .limit(limit)
        .offset(offset) as Promise<ArticleWithReadState[]>;
}

export async function countArticlesGlobal(
    userId: string,
    options: { unread?: boolean; feedId?: string },
    dbClient: DbClient = db,
): Promise<number> {
    const conditions = [eq(article.userId, userId)];
    if (options.feedId) conditions.push(eq(article.feedId, options.feedId));

    if (options.unread) {
        const result = await dbClient
            .select({count: sql<number>`count(*)::int`})
            .from(article)
            .leftJoin(
                userArticleStates,
                and(
                    eq(userArticleStates.articleId, article.id),
                    eq(userArticleStates.userId, userId),
                ),
            )
            .where(and(...conditions, isNull(userArticleStates.readAt)));
        return result[0]?.count ?? 0;
    }

    const result = await dbClient
        .select({count: sql<number>`count(*)::int`})
        .from(article)
        .where(and(...conditions));
    return result[0]?.count ?? 0;
}

export async function markArticleAsRead(
    articleId: string,
    userId: string,
    dbClient: DbClient = db,
): Promise<ArticleWithReadState | null> {
    const rows = await dbClient
        .select()
        .from(article)
        .where(and(eq(article.id, articleId), eq(article.userId, userId)));

    if (rows.length === 0) return null;

    await dbClient
        .insert(userArticleStates)
        .values({
            userId,
            articleId,
            isRead: true,
            readAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
            target: [userArticleStates.userId, userArticleStates.articleId],
            set: {isRead: true, readAt: new Date().toISOString()},
        });

    const result = await buildArticleSelect(userId, dbClient)
        .where(and(eq(article.id, articleId), eq(article.userId, userId)));

    return (result[0] as ArticleWithReadState) ?? null;
}

export async function markAllArticlesAsRead(
    feedId: string,
    userId: string,
    dbClient: DbClient = db,
): Promise<number> {
    const articleRows = await dbClient
        .select({id: article.id})
        .from(article)
        .where(and(eq(article.feedId, feedId), eq(article.userId, userId)));

    if (articleRows.length === 0) return 0;

    const now = new Date().toISOString();
    const values = articleRows.map(({id}) => ({
        userId,
        articleId: id,
        isRead: true as const,
        readAt: now,
    }));

    await dbClient
        .insert(userArticleStates)
        .values(values)
        .onConflictDoUpdate({
            target: [userArticleStates.userId, userArticleStates.articleId],
            set: {isRead: true, readAt: now},
        });

    return articleRows.length;
}

export async function markAllArticlesAsReadGlobal(
    userId: string,
    dbClient: DbClient = db,
): Promise<number> {
    const articleRows = await dbClient
        .select({id: article.id})
        .from(article)
        .where(eq(article.userId, userId));

    if (articleRows.length === 0) return 0;

    const now = new Date().toISOString();
    const values = articleRows.map(({id}) => ({
        userId,
        articleId: id,
        isRead: true as const,
        readAt: now,
    }));

    await dbClient
        .insert(userArticleStates)
        .values(values)
        .onConflictDoUpdate({
            target: [userArticleStates.userId, userArticleStates.articleId],
            set: {isRead: true, readAt: now},
        });

    return articleRows.length;
}