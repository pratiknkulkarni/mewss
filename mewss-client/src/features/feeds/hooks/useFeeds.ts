import {useQuery} from "@tanstack/react-query";
import type {Feed} from "@/types/api.ts";
import {feedApi} from "@/lib/feed-api.ts";
import {feedKeys} from "@/lib/query-keys";


interface UseFeedsOptions {
    refetchInterval?: number;
}

export function useFeeds(status?: string, options?: UseFeedsOptions) {
    return useQuery({
        queryKey: feedKeys.list(status ? status : undefined),
        queryFn: () => feedApi.list(status ? status : undefined),
        select: (data): Feed[] => data.feeds,
        staleTime: 0,
        refetchInterval: options?.refetchInterval,
    });
}