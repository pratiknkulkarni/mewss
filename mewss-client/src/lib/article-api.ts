import type { ArticlesResponse, ArticleFilters, ArticleResponse } from "@/types/api.ts";
import { apiClient } from "./api-client.ts";

export const articleApi = {
    list: (params?: ArticleFilters): Promise<ArticlesResponse> => {
        const { feedId, ...rest } = params ?? {};

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
