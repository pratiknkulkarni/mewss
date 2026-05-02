import {useMutation, useQueryClient} from "@tanstack/react-query";
import {articleApi} from "@/lib/article-api.ts";
import type {ArticlesResponse} from "@/types/api.ts";
import {articleKeys} from "@/lib/query-keys";

export function useMarkArticleUnread() {
    const queryClient = useQueryClient();
    return useMutation({
        onMutate: (articleId: string) => {
            queryClient.setQueriesData(
                {queryKey: articleKeys.all},
                (old: ArticlesResponse | undefined) => {
                    if (!old) return old
                    return {
                        ...old,
                        articles: old.articles.map((a) =>
                            a.id === articleId ? {...a, isRead: false} : a // manually flip the value of isRead to false...
                        ),
                    }
                }
            )
        },
        onError: async () => {
            await queryClient.invalidateQueries({queryKey: articleKeys.all})
        },
        mutationFn: (articleId: string) => articleApi.markUnread(articleId),
    })
}