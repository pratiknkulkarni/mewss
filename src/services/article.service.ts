import * as feedRepo from "../repositories/feed.repository.js";
import * as articleRepo from "../repositories/article.repository.js";
import {NotFoundError} from "../errors/errors.js";

export async function listArticlesForFeed(
    feedId: string,
    userId: string,
) {
    const feedRow = await feedRepo.findFeedByIdAndUser(feedId, userId);
    if (!feedRow) {
        console.log("not found")
        throw new NotFoundError();
    }
    await articleRepo.listArticlesByFeed(feedId, userId);

    console.log(feedId, userId);
}