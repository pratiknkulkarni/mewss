import type {ArticleFilters} from "@/types/api"

export const authKeys = {
    all: ['auth'] as const,
    session: () => [...authKeys.all, 'session'] as const,
    sessionList: () => [...authKeys.all, 'sessions', 'list'] as const,
}

export const articleKeys = {
    all: ["articles"] as const,

    global: (filters?: Omit<ArticleFilters, "feedId">) =>
        [...articleKeys.all, "global", filters] as const,

    // adding feedId separately since ArticleFilters can have undefined "feedId"
    byFeed: (feedId: string, filters?: Omit<ArticleFilters, "feedId">) =>
        [...articleKeys.all, "feed", feedId, filters] as const,

    detail: (id: string) => [...articleKeys.all, "detail", id] as const,
}
export const feedKeys = {
    all: ['feeds'] as const,
    lists: () => [...feedKeys.all, 'list'] as const,
    list: (status?: string) => [...feedKeys.lists(), {status}] as const,
};

export const settingsKeys = {
    all: ["settings"] as const,
    detail: () => [...settingsKeys.all, "detail"] as const,
};
