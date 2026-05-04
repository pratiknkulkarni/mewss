import {apiClient} from "@/lib/api-client.ts";

export const opmlApi = {
    import: (file: File): Promise<void> => {
        const formData = new FormData()
        formData.append('file', file)

        return apiClient.post('/api/import/opml', formData)
    },

    export: (): Promise<Blob> => {
        return fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}/api/export/opml`, {
            credentials: "include"
        }).then(res => {
            if (!res.ok) throw new Error('Failed to export OPML')
            return res.blob()
        })
    }
}