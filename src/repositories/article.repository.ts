import type {NodePgDatabase} from "drizzle-orm/node-postgres";
import {article, userArticleStates} from "../db/generated/schema.js";
import {and, eq, getTableColumns, isNull, sql} from "drizzle-orm";
import {db} from "../db/db.js";

type DbClient = NodePgDatabase;

// type Article = typeof article.$inferSelect;

type ArticleWithReadState = typeof article.$inferSelect & {
    isRead: boolean;
    readAt: string | null;
};

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
                                         page: number,
                                         limit: number,
                                         unread?: boolean,
                                         dbClient: DbClient = db): Promise<ArticleWithReadState[]> {

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