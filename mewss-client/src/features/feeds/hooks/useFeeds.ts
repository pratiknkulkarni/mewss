import { useQuery } from "@tanstack/react-query";
import type { Feed, FeedsResponse } from "@/types/api.ts";
import type { ApiError } from "@/lib/api-error.ts";
import { feedApi } from "@/lib/feed-api.ts";
import { feedKeys } from "@/lib/query-keys";

export function useFeeds(status?: string) {
    return useQuery<FeedsResponse, ApiError, Feed[]>({
        queryKey: feedKeys.list(status),
        queryFn: () => feedApi.list(status),
        staleTime: 0,
        // To unwrap or not to unwrap? Unwrap, makes it easier in the user
        select: (data) => data.feeds,
    })
}