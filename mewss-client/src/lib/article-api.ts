import type {ArticlesResponse, ArticleFilters, ArticleResponse} from "../types/api.ts";
import {apiClient} from "./api-client.ts";

export const articleApi = {
    // listGlobal: (params?: ArticleFilters): Promise<ArticlesResponse> => {
    //     console.log(`making requests with params -> `)
    //     console.log(params);
    //     return apiClient.get<ArticlesResponse>("/api/articles", params as Record<string, unknown>)
    // },
    //
    // listByFeed: (feedId: string, params?: ArticleListParams): Promise<ArticlesResponse> =>
    //     apiClient.get<ArticlesResponse>(
    //         `/api/feeds/${feedId}/articles`,
    //         params as Record<string, unknown>,
    //     ),

    list: (params?: ArticleFilters): Promise<ArticlesResponse> => {
        const {feedId, ...rest} = params ?? {};

        if (feedId) {
            return apiClient.get<ArticlesResponse>(
                `/api/feeds/${feedId}/articles`,
                rest as Record<string, unknown>
            )
        }

        return apiClient.get<ArticlesResponse>(
            "/api/articles",
            rest as Record<string, unknown>
        )
    },

    markRead: (id: string): Promise<ArticleResponse> => {
        return apiClient.patch<ArticleResponse>(`/api/articles/${id}/read`)
    }
}
