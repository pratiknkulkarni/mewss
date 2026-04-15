import {useQuery} from "@tanstack/react-query";
import type {ArticlesResponse} from "../../../types/api.ts";
import {articleApi, type ArticleListParams2} from "../../../lib/article-api.ts";
import type {ApiError} from "../../../lib/api-error.ts";

export function useGlobalArticles(params?: ArticleListParams2) {
    return useQuery<ArticlesResponse, ApiError>({
        queryFn: () => articleApi.list(params),
        // queryKey: [], //TODO: add the keys here, putting this only to get rid of the v4 error
        queryKey: ['articles', params],
        staleTime: 60000,
        refetchInterval: 60000,
        keepPreviousData: true,
    })
}
