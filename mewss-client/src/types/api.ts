//TODO: I need to find a way to sync all these interfaces with the scheduler and API client.
// It is going to be a pain later on.
// Change even a single column or add/remove, it'll be a mess.
export interface Feed {
    id: string;
    userId: string;
    url: string;
    refreshInterval: number;
    errorCount: number | null;
    status: string | null;
    nextFetchAfter: string | null;
    forceRefresh: boolean | null;
    fetchingAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    etag: string | null;
    lastModifiedHeader: string | null;
}

export interface Article {
    id: string;
    feedId: string;
    userId: string;
    guid: string | null;
    title: string;
    url: string;
    author: string | null;
    publishedAt: string | null;
    summary: string | null;
    content: string | null;
    identityHash: string;
    createdAt: string | null;
    isRead: boolean;
    readAt: string | null;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}

// response for /api/articles
export interface ArticlesResponse {
    articles: Article[];
    pagination: Pagination;
}

export interface GlobalArticleListParams {
    page?: number;
    limit?: number;
    unread?: boolean;
    feedId?: string;
}

export interface ArticleListParams {
    page?: number;
    limit?: number;
    unread?: boolean;
}