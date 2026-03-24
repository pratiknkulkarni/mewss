import * as feedRepo from "../repositories/feed.repository.js";
import * as articleRepo from "../repositories/article.repository.js";
import {NotFoundError} from "../errors/errors.js";
import {z} from "zod";
import {createLogger} from "../lib/logger.js";

const logger = createLogger("service.article");

export function buildPagination(page: number, limit: number, total: number) {
    return {
        page,
        limit,
        total,
        hasMore: page * limit < total,
    };
}

// TODO: can I put all these schemas in a separate file?
export const listArticlesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    unread: z.string().optional().transform((v) => v === "true" ? true : v === "false" ? false : undefined),
});

// another one
export const listArticlesGlobalSchema = listArticlesSchema.extend({
    feedId: z.string().optional(),
});

export async function listArticlesForFeed(
    feedId: string,
    userId: string,
    query: z.infer<typeof listArticlesSchema>,
) {
    const feedRow = await feedRepo.findFeedByIdAndUser(feedId, userId);
    if (!feedRow) {
        logger.warn({feedId, userId}, "feed not found for article listing");
        throw new NotFoundError();
    }

    const {page, limit, unread} = query;

    const articles = await articleRepo.listArticlesByFeed(feedId, userId, page, limit, unread)
    const totalArticles = await articleRepo.countArticlesByFeedAndUser(feedId, userId, {unread})

    logger.info({feedId, userId, page, limit}, "articles listed for feed");
    return {articles: articles, pagination: buildPagination(page, limit, totalArticles)}
}


export async function listArticlesGlobal(
    userId: string,
    query: z.infer<typeof listArticlesGlobalSchema>,
) {
    const {page, limit, unread, feedId} = query;
    const [articles, total] = await Promise.all([
        articleRepo.listArticlesGlobal(userId, {page, limit, unread, feedId}),
        articleRepo.countArticlesGlobal(userId, {unread, feedId}),
    ]);

    logger.info({userId, page, limit, total}, "global article inbox listed");
    return {articles, pagination: buildPagination(page, limit, total)};
}

export async function markArticleRead(articleId: string, userId: string) {
    const updated = await articleRepo.markArticleAsRead(articleId, userId);
    if (!updated) {
        logger.warn({articleId, userId}, "article not found for mark-as-read");
        throw new NotFoundError();
    }
    logger.info({articleId, userId}, "article marked as read");
    return updated;
}

export async function markFeedArticlesRead(feedId: string, userId: string) {
    // Verify feed ownership before bulk-updating (opaque 404 pattern)
    const feedRow = await feedRepo.findFeedByIdAndUser(feedId, userId);
    if (!feedRow) {
        logger.warn({feedId, userId}, "feed not found for bulk mark-as-read");
        throw new NotFoundError();
    }

    const updatedCount = await articleRepo.markAllArticlesAsRead(feedId, userId);
    logger.info({feedId, userId, updatedCount}, "all articles in feed marked as read");
    return {updatedCount};
}

export async function markAllArticlesRead(userId: string) {
    const updatedCount = await articleRepo.markAllArticlesAsReadGlobal(userId);
    logger.info({userId, updatedCount}, "all articles marked as read");
    return {updatedCount};
}