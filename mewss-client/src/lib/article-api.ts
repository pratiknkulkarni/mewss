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
    },
    markUnread: (id: string): Promise<ArticleResponse> => {
        return apiClient.patch<ArticleResponse>(`/api/articles/${id}/unread`)
    },
    get: (id: string): Promise<ArticleResponse> =>
        apiClient.get<ArticleResponse>(`/api/articles/${id}`),

    markAllRead: (): Promise<{ updatedCount: number }> =>
        apiClient.post<{ updatedCount: number }>('/api/articles/read-all'),

    star: (id: string): Promise<ArticleResponse> =>
        apiClient.patch<ArticleResponse>(`/api/articles/${id}/star`),

    unstar: (id: string): Promise<ArticleResponse> =>
        apiClient.patch<ArticleResponse>(`/api/articles/${id}/unstar`),
}
