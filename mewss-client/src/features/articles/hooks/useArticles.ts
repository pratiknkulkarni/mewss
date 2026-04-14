import {useQuery} from "@tanstack/react-query";
import type {ArticlesResponse, GlobalArticleListParams} from "../../../types/api.ts";
import {articleApi} from "../../../lib/article-api.ts";
import type {ApiError} from "../../../lib/api-error.ts";

export function useGlobalArticles(params?: GlobalArticleListParams) {
    return useQuery<ArticlesResponse, ApiError>({
        queryFn: () => articleApi.listGlobal(params),
        queryKey: [], //TODO: add the keys here, putting this only to get rid of the v4 error
        staleTime: 60000,
        refetchInterval: 60000
    })
}