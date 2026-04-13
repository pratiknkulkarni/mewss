import {useQuery} from "@tanstack/react-query";
import type {GlobalArticleListParams} from "../../../types/api.ts";
import {articleApi} from "../../../lib/article-api.ts";

export function useGlobalArticles(params?: GlobalArticleListParams) {
    return useQuery({
        queryFn: () => articleApi.listGlobal(params),
        staleTime: 60000,
        refetchInterval: 60000
    })
}
