import {useMutation, useQueryClient} from "@tanstack/react-query";
import type {UpdateFeedInput} from "@/types/api.ts";
import {feedApi} from "@/lib/feed-api.ts";
import {feedKeys} from "@/lib/query-keys.ts";

export function useUpdateFeed() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({id, input}: { id: string; input: UpdateFeedInput }) =>
            feedApi.update(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: feedKeys.all})
        },
    })
}