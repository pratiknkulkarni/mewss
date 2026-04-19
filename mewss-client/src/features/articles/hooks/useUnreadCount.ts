import { useQuery } from "@tanstack/react-query";
import type { ArticlesResponse } from "../../../types/api";
import type { ApiError } from "../../../lib/api-error";
import { ARTICLE_POLL_INTERVAL_MS, ARTICLE_STALE_TIME_MS, articleKeys } from "./useArticles";
import { articleApi } from "../../../lib/article-api";

// Here I am limiting to one because it still gives total articles present.
// The condition (unread) filters it further ONLY FOR UNREAD ARTICLES.
// Verified by running difference between all articles and read articles SQL.
// select (select count(*)
//     from user_article_states us
//              join article a on a.id = us.article_id
//     where a.feed_id = '')
//        -
//    (select count(*)
//     from article
//     where feed_id = '') as count_diff; <- this gives difference which is only "unread" articles.
export function useUnreadCount() {
    return useQuery<ArticlesResponse, ApiError, number>({
        queryKey: [...articleKeys.all, "unread-count"],
        queryFn: () => articleApi.list({ unread: true, limit: 1, page: 1 }),
        select: (data) => data.pagination.total,
        staleTime: ARTICLE_STALE_TIME_MS,
        refetchInterval: ARTICLE_POLL_INTERVAL_MS,
    })
}