import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articleApi } from "@/lib/article-api.ts";
import type { ArticlesResponse } from "@/types/api.ts";
import { articleKeys } from "@/lib/query-keys";

export function useStarArticle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ articleId, currentlyStarred }: { articleId: string; currentlyStarred: boolean }) =>
            currentlyStarred ? articleApi.unstar(articleId) : articleApi.star(articleId),

        onMutate: ({ articleId, currentlyStarred }) => {
            queryClient.setQueriesData(
                { queryKey: articleKeys.all },
                (old: ArticlesResponse | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        articles: old.articles.map((a) =>
                            a.id === articleId
                                ? {
                                    ...a,
                                    isStarred: !currentlyStarred,
                                    starredAt: currentlyStarred ? null : new Date().toISOString(),
                                }
                                : a
                        ),
                    };
                }
            );
        },

        onError: () => {
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
        },
    });
}