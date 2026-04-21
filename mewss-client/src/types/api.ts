//TODO: I need to find a way to sync all these interfaces with the scheduler and API client.
// It is going to be a pain later on.
// Change even a single column or add/remove, it'll be a mess.

/**
 * Represents a feed that contains articles.
 */
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

/**
 * Represents an individual article within a feed.
 */
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

/**
 * Pagination details for paginated API responses.
 */
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}

/**
 * Response structure for article list endpoints (e.g., /api/articles).
 */
export interface ArticlesResponse {
    /** The list of articles retrieved. */
    articles: Article[];
    /** Pagination metadata for the list. */
    pagination: Pagination;
}

export interface ArticleResponse {
    article: Article
}

/**
 * Parameters for listing articles globally across all feeds.
 */
export interface ArticleFilters {
    /** The page number to retrieve. */
    page?: number;
    /** The number of articles per page. */
    limit?: number;
    /** Filter to return only unread articles. */
    unread?: boolean;
    /** Filter articles by a specific feed ID. */
    feedId?: string;
}

/**
 * Parameters for listing articles from a specific feed.
 */
export interface ArticleListParams {
    /** The page number to retrieve. */
    page?: number;
    /** The number of articles per page. */
    limit?: number;
    /** Filter to return only unread articles. */
    unread?: boolean;
}

export interface FeedFilters {
    /** Filter to return articles based on active/inactive status. */
    status?: string;
    /** Filter articles by a specific feed ID. */
    feedId?: string;
}

/**
 * Response structure for feed list endpoints (e.g., /api/feed).
 */
export interface FeedsResponse {
    /** The list of feeds retrieved. */
    feeds: Feed[];
}

export interface FeedResponse {
    feed: Feed
}

export interface CreateFeedInput {
    url: string
    refreshInterval: string
}