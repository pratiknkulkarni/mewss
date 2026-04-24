import { useQuery } from "@tanstack/react-query";
import type { ArticleFilters, ArticlesResponse } from "@/types/api.ts";
import { articleApi } from "@/lib/article-api.ts";
import type { ApiError } from "@/lib/api-error.ts";
import { articleKeys } from "@/lib/query-keys";


export const ARTICLE_STALE_TIME_MS = 60000
export const ARTICLE_POLL_INTERVAL_MS = 60000

export function useArticles(filters?: ArticleFilters) {
    const { feedId, ...rest } = filters ?? {};

    return useQuery<ArticlesResponse, ApiError>({
        queryKey: feedId ? articleKeys.byFeed(feedId, rest) : articleKeys.global(rest),
        queryFn: () => articleApi.list(filters),
        staleTime: ARTICLE_STALE_TIME_MS,
        refetchInterval: ARTICLE_POLL_INTERVAL_MS,
        keepPreviousData: true,
    })
}
