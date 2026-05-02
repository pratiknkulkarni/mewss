import type { CreateFeedInput, FeedResponse, FeedsResponse, UpdateFeedInput } from "@/types/api";
import { apiClient } from "./api-client";

export const feedApi = {
    list: (status?: string): Promise<FeedsResponse> =>
        apiClient.get<FeedsResponse>('/api/feeds', status ? { status } : undefined),

    create: (input: CreateFeedInput) =>
        apiClient.post<FeedResponse>('/api/feeds', input),

    update: (id: string, input: UpdateFeedInput) =>
        apiClient.patch<FeedResponse>(`/api/feeds/${id}`, input),

    delete: (id: string): Promise<void> =>
        apiClient.delete<void>(`/api/feeds/${id}`),

    refresh: (id: string): Promise<{ message: string }> =>
        apiClient.post<{ message: string }>(`/api/feeds/${id}/refresh`),

    markAllRead: (feedId: string): Promise<{ updatedCount: number }> =>
        apiClient.post<{ updatedCount: number }>(`/api/feeds/${feedId}/articles/read-all`),

    markAllReadGlobal: (): Promise<{ updatedCount: number }> =>
        apiClient.post<{ updatedCount: number }>(`/api/articles/read-all`),
}