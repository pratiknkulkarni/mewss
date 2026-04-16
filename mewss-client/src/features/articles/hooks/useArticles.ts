import {useQuery} from "@tanstack/react-query";
import type {ArticleFilters, ArticlesResponse} from "../../../types/api.ts";
import {articleApi} from "../../../lib/article-api.ts";
import type {ApiError} from "../../../lib/api-error.ts";


export const articleKeys = {
    all: ["articles"] as const,

    global: (filters?: Omit<ArticleFilters, "feedId">) =>
        [...articleKeys.all, "global", filters] as const,

    // adding feedId separately since ArticleFilters can have undefined "feedId"
    byFeed: (feedId: string, filters?: Omit<ArticleFilters, "feedId">) =>
        [...articleKeys.all, "feed", feedId, filters] as const,

    detail: (id: string) => [...articleKeys.all, "detail", id] as const,
}

const ARTICLE_STALE_TIME_MS = 60000
const ARTICLE_POLL_INTERVAL_MS = 60000

export function useArticles(filters?: ArticleFilters) {
    const {feedId, ...rest} = filters ?? {};

    return useQuery<ArticlesResponse, ApiError>({
        queryKey: feedId ? articleKeys.byFeed(feedId) : articleKeys.global(rest),
        queryFn: () => articleApi.list(filters),
        // queryKey: ['articles', params],
        // queryKey: feed
        staleTime: ARTICLE_STALE_TIME_MS,
        refetchInterval: ARTICLE_POLL_INTERVAL_MS,
        keepPreviousData: true,
    })
}
