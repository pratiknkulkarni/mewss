import type {NodePgDatabase} from "drizzle-orm/node-postgres";
import {article, userArticleStates} from "../db/generated/schema.js";
import {and, eq, getTableColumns, sql} from "drizzle-orm";
import {db} from "../db/db.js";

type DbClient = NodePgDatabase;

// type Article = typeof article.$inferSelect;

type ArticleWithReadState = typeof article.$inferSelect & {
    isRead: boolean;
    readAt: string | null;
};

// help
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

export async function listArticlesByFeed(feedId: string, userId: string, dbClient: DbClient = db): Promise<ArticleWithReadState[]> {
    // TODO: SQL query I need to convert ->
    // SELECT article.id,
    //     article.feed_id,
    //     article.user_id,
    //     article.guid,
    //     article.title,
    //     article.url,
    //     article.author,
    //     article.published_at,
    //     article.summary,
    //     article.identity_hash,
    //     article.created_at,
    //     COALESCE(user_article_states.is_read, false) AS "isRead",
    //     user_article_states.read_at                  AS "readAt"
    // FROM article
    // LEFT JOIN user_article_states
    // ON user_article_states.article_id = article.id
    // AND user_article_states.user_id = '';

    const conditions = [
        eq(article.feedId, feedId),
        eq(article.userId, userId),
    ];
    //
    // const response = dbClient
    //     .select({
    //         ...getTableColumns(article),
    //         isRead: sql<boolean>`COALESCE(
    //         ${userArticleStates.isRead},
    //         false
    //         )`,
    //         readAt: userArticleStates.readAt,
    //     })
    //     .from(article)
    //     .leftJoin(
    //         userArticleStates,
    //         and(
    //             eq(userArticleStates.articleId, article.id),
    //             eq(userArticleStates.userId, userId),
    //         ),
    //     ).where((and(...conditions))) as Promise<ArticleWithReadState[]>;
    // console.log("==>")
    // const r = await response;
    // console.log(r);
    // r.map(ar => {
    //     console.log(" ar => ")
    //     console.log(ar);
    //     console.log("<= ar ")
    // })
    // console.log("<==")


    const response = buildArticleSelect(userId, dbClient)
        .where(and(...conditions))
        .orderBy(sql`${article.publishedAt}
        DESC NULLS LAST`) as Promise<ArticleWithReadState[]>;

    return response;
}