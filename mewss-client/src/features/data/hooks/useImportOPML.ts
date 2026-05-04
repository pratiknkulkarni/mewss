import {articleKeys, feedKeys} from '@/lib/query-keys'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {opmlApi} from "@/lib/data-api.ts";

export function useImportOpml() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (file: File) => opmlApi.import(file),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: feedKeys.all})
            queryClient.invalidateQueries({queryKey: articleKeys.all})
        },
    })
}
