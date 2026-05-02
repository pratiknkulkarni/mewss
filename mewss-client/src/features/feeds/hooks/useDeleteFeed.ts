import { feedApi } from '@/lib/feed-api'
import { articleKeys, feedKeys } from '@/lib/query-keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useDeleteFeed() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (feedId: string) => feedApi.delete(feedId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feedKeys.all })
            queryClient.invalidateQueries({ queryKey: articleKeys.all })
        },
    })
}