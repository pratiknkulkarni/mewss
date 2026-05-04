import {useMutation} from '@tanstack/react-query'
import {opmlApi} from "@/lib/data-api.ts";

export function useExportOpml() {
    return useMutation({
        mutationFn: () => opmlApi.export(),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `mewss-subscriptions-${new Date().toISOString().split('T')[0]}.opml`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        },
    })
}