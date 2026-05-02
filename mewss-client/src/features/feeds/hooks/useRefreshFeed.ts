import { feedApi } from '@/lib/feed-api'
// import { articleKeys } from '@/lib/query-keys'
import { useMutation } from '@tanstack/react-query'

// if single feed is marked for deletion -> refresh([feedId])
// if multiple/all feeds are marked for deletion -> refresh(feeds.map(f => f.id))
export function useRefreshFeed() {
    // const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (feedIds: string[]) => {
            await Promise.allSettled(feedIds.map((id) => feedApi.refresh(id)))
        },
    })
}