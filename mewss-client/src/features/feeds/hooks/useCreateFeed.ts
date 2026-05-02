import { feedApi } from "@/lib/feed-api";
import type { CreateFeedInput } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedKeys } from "@/lib/query-keys";

export function useCreateFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateFeedInput) => feedApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: feedKeys.list()
            })
        }
    })
}