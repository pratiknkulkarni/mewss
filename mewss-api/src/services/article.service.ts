import * as feedRepo from "../repositories/feed.repository.js";
import * as articleRepo from "../repositories/article.repository.js";
import { NotFoundError } from "../errors/errors.js";
import { z } from "zod";
import { createLogger } from "../lib/logger.js";
import type { ListOptions } from "../repositories/article.repository.js";

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
    starred: z.string().optional().transform((v) => v === "true" ? true : v === "false" ? false : undefined),
});

// another one
export const listArticlesGlobalSchema = listArticlesSchema.extend({
    feedId: z.string().optional(),
});

// and another one
export const bulkFeedActionSchema = z.object({
    feedIds: z.array(z.string().min(1)).min(1).max(50, "Maximum 50 feeds per bulk operation"),
});

export async function listArticlesForFeed(
    feedId: string,
    userId: string,
    query: ListOptions,
    // query: z.infer<typeof listArticlesSchema>,
) {
    const feedRow = await feedRepo.findFeedByIdAndUser(feedId, userId);
    if (!feedRow) {
        logger.warn({ feedId, userId }, "feed not found for article listing");
        throw new NotFoundError();
    }

    const { page, limit, unread, starred } = query;

    // const articles = await articleRepo.listArticlesByFeed(feedId, userId, {unread, page, limit})
    // const totalArticles = await articleRepo.countArticlesByFeedAndUser(feedId, userId, {unread})

    const [articles, totalArticles] = await Promise.all([
        articleRepo.listArticlesByFeed(feedId, userId, { unread, page, limit, starred }),
        articleRepo.countArticlesByFeedAndUser(feedId, userId, { unread }),
    ])

    logger.info({ feedId, userId, page, limit, starred }, "articles listed for feed");
    return { articles: articles, pagination: buildPagination(page, limit, totalArticles) }
}


export async function listArticlesGlobal(
    userId: string,
    query: z.infer<typeof listArticlesGlobalSchema>,
) {
    const { page, limit, unread, feedId, starred } = query;
    const [articles, total] = await Promise.all([
        articleRepo.listArticlesGlobal(userId, { page, limit, unread, feedId, starred }),
        articleRepo.countArticlesGlobal(userId, { unread, feedId }),
    ]);

    logger.info({ userId, page, limit, total, starred }, "global article inbox listed");
    return { articles, pagination: buildPagination(page, limit, total) };
}

export async function markArticleRead(articleId: string, userId: string) {
    const updated = await articleRepo.markArticleAsRead(articleId, userId);
    if (!updated) {
        logger.warn({ articleId, userId }, "article not found for mark-as-read");
        throw new NotFoundError();
    }
    logger.info({ articleId, userId }, "article marked as read");
    return updated;
}

export async function markFeedArticlesRead(feedId: string, userId: string) {
    // Verify feed ownership before bulk-updating (opaque 404 pattern)
    const feedRow = await feedRepo.findFeedByIdAndUser(feedId, userId);
    if (!feedRow) {
        logger.warn({ feedId, userId }, "feed not found for bulk mark-as-read");
        throw new NotFoundError();
    }

    const updatedCount = await articleRepo.markAllArticlesAsRead(feedId, userId);
    logger.info({ feedId, userId, updatedCount }, "all articles in feed marked as read");
    return { updatedCount };
}

export async function markAllArticlesRead(userId: string) {
    const updatedCount = await articleRepo.markAllArticlesAsReadGlobal(userId);
    logger.info({ userId, updatedCount }, "all articles marked as read");
    return { updatedCount };
}

export async function markFeedArticlesUnread(feedId: string, userId: string) {
    const feedRow = await feedRepo.findFeedByIdAndUser(feedId, userId);
    if (!feedRow) {
        logger.warn({ feedId, userId }, "feed not found for bulk mark-as-unread");
        throw new NotFoundError();
    }
    const updatedCount = await articleRepo.markAllArticlesAsUnread(feedId, userId);
    logger.info({ feedId, userId, updatedCount }, "all articles in feed marked as unread");
    return { updatedCount };
}


export async function markFeedsBulkRead(feedIds: string[], userId: string) {
    // Verify ALL feedIds belong to this user before touching any state.
    // If any are missing, return opaque 404 — don't reveal which ones exist.
    const found = await feedRepo.findFeedsByIdsAndUser(feedIds, userId);
    if (found.length !== feedIds.length) {
        logger.warn({ feedIds, userId, found: found.length }, "one or more feeds not found for bulk read");
        throw new NotFoundError();
    }
    const updatedCount = await articleRepo.markAllArticlesAsReadForFeeds(feedIds, userId);
    logger.info({ feedIds, userId, updatedCount }, "articles in selected feeds marked as read");
    return { updatedCount };
}

export async function markFeedsBulkUnread(feedIds: string[], userId: string) {
    const found = await feedRepo.findFeedsByIdsAndUser(feedIds, userId);
    if (found.length !== feedIds.length) {
        logger.warn({ feedIds, userId, found: found.length }, "one or more feeds not found for bulk unread");
        throw new NotFoundError();
    }
    const updatedCount = await articleRepo.markAllArticlesAsUnreadForFeeds(feedIds, userId);
    logger.info({ feedIds, userId, updatedCount }, "articles in selected feeds marked as unread");
    return { updatedCount };
}

export async function markArticleUnread(articleId: string, userId: string) {
    const updated = await articleRepo.markArticleAsUnread(articleId, userId);
    if (!updated) {
        logger.warn({ articleId, userId }, "article not found for mark-as-unread");
        throw new NotFoundError();
    }

    logger.info({ articleId, userId }, "article marked as unread");
    return updated;
}

export async function getArticle(articleId: string, userId: string) {
    const row = await articleRepo.findArticleByIdAndUser(articleId, userId);
    if (!row) {
        logger.warn({ articleId, userId }, "article not found");
        throw new NotFoundError();
    }
    logger.info({ articleId, userId }, "article retrieved");
    return row;
}

export async function starArticle(articleId: string, userId: string) {
    const updated = await articleRepo.starArticle(articleId, userId);
    if (!updated) {
        logger.warn({ articleId, userId }, "article not found for starring");
        throw new NotFoundError();
    }
    logger.info({ articleId, userId }, "article starred");
    return updated;
}

export async function unstarArticle(articleId: string, userId: string) {
    const updated = await articleRepo.unstarArticle(articleId, userId);
    if (!updated) {
        logger.warn({ articleId, userId }, "article not found for unstarring");
        throw new NotFoundError();
    }
    logger.info({ articleId, userId }, "article unstarred");
    return updated;
}