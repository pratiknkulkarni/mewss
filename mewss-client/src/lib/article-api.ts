import type {ArticleListParams, ArticlesResponse, GlobalArticleListParams} from "../types/api.ts";
import {apiClient} from "./api-client.ts";

export interface ArticleListParams2 {
    feedId?: string
    unread?: boolean
    page?: number
    limit?: number
}

export const articleApi = {
    listGlobal: (params?: GlobalArticleListParams): Promise<ArticlesResponse> => {
        console.log(`making requests with params -> `)
        console.log(params);
        return apiClient.get<ArticlesResponse>("/api/articles", params as Record<string, unknown>)
    },

    listByFeed: (feedId: string, params?: ArticleListParams): Promise<ArticlesResponse> =>
        apiClient.get<ArticlesResponse>(
            `/api/feeds/${feedId}/articles`,
            params as Record<string, unknown>,
        ),

    // TESTING TO SEE IF THIS WORKS; CLUBBING THE ABOVE INTO ONE
    list: (params?: ArticleListParams2): Promise<ArticlesResponse> => {
        // const {feedId, ...rest} = params ?? {}
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

}
