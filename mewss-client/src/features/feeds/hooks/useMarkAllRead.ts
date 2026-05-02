import { feedApi } from '@/lib/feed-api'
import { articleKeys } from '@/lib/query-keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMarkAllRead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (feedId: string | undefined | null) => {
            if (feedId) {
                return feedApi.markAllRead(feedId)
            }
            return feedApi.markAllReadGlobal();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: articleKeys.all })
        },
    })
}