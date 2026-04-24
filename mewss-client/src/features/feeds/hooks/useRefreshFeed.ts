import { feedApi } from '@/lib/feed-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { articleKeys } from '@/features/articles/hooks/useArticles'

// if single feed is marked for deletion -> refresh([feedId])
// if multiple/all feeds are marked for deletion -> refresh(feeds.map(f => f.id))
export function useRefreshFeed() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (feedIds: string[]) => {
            await Promise.allSettled(feedIds.map((id) => feedApi.refresh(id)))
        },
        onSuccess: () => {
            // I am adding this because refreshing a feed does have a 10 second poll interval.
            // I can reduce this to 5000 but there's some delay:w
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: articleKeys.all })
            }, 10000)
        },
    })
}