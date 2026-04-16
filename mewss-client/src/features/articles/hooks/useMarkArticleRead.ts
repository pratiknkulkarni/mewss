import {useMutation, useQueryClient} from "@tanstack/react-query";
import {articleApi} from "../../../lib/article-api.ts";
import {articleKeys} from "./useArticles.ts";
import type {ArticlesResponse} from "../../../types/api.ts";

export function useMarkArticleRead() {
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
                            a.id === articleId ? {...a, isRead: true} : a
                        ),
                    }
                }
            )
        },
        // onSuccess: async () => {
        //     await queryClient.invalidateQueries({
        //         queryKey: articleKeys.all
        //     })
        // },
        onError: () => {
            queryClient.invalidateQueries({queryKey: articleKeys.all})
        },
        mutationFn: (articleId: string) => articleApi.markRead(articleId),
    })
}