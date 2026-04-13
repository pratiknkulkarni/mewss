import {useQuery} from "@tanstack/react-query";
import type {ArticlesResponse} from "../../../types/api.ts";
import {apiClient} from "../../../lib/api-client.ts";

interface GlobalArticleListParams {
    page?: number;
    limit?: number;
    unread?: boolean;
    feedId?: string;
}

const listGlobal = (params?: GlobalArticleListParams): Promise<ArticlesResponse> => {
    return apiClient.get<ArticlesResponse>("/api/articles", params as Record<string, unknown>)
}

export function useGlobalArticles(params?: GlobalArticleListParams) {
    return useQuery({
        // queryFn: async () => {
        //     const url = "/api/articles";
        //     const response = await fetch(url, {
        //         credentials: "include",
        //         headers: {
        //             "Content-Type": "application/json"
        //         }
        //     })
        //
        //     return response.json();
        // },
        queryFn: () => listGlobal(params),
        staleTime: 60000,
        refetchInterval: 60000
    })
}
