import type { FeedsResponse } from "../types/api";
import { apiClient } from "./api-client";

export const feedApi = {
    list: (status?: string): Promise<FeedsResponse> =>
        apiClient.get<FeedsResponse>('/api/feeds', status ? { status } : undefined),
}