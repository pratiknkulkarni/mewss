import * as feedRepo from "../repositories/feed.repository.js";
import * as articleRepo from "../repositories/article.repository.js";
import {NotFoundError} from "../errors/errors.js";
import {z} from "zod";
import {createLogger} from "../lib/logger.js";

const logger = createLogger("service.article");

export const listArticlesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    unread: z.string().optional().transform((v) => v === "true" ? true : v === "false" ? false : undefined),
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

    logger.info({feedId, userId, page, limit}, "articles listed for feed");
    return {articles: articles}
}