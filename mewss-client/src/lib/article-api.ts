import type {ArticleListParams, ArticlesResponse, GlobalArticleListParams} from "../types/api.ts";
import {apiClient} from "./api-client.ts";

export const articleApi = {
    listGlobal: (params?: GlobalArticleListParams): Promise<ArticlesResponse> => {
        return apiClient.get<ArticlesResponse>("/api/articles", params as Record<string, unknown>)
    },

    listByFeed: (feedId: string, params?: ArticleListParams): Promise<ArticlesResponse> =>
        apiClient.get<ArticlesResponse>(
            `/api/feeds/${feedId}/articles`,
            params as Record<string, unknown>,
        ),
}
