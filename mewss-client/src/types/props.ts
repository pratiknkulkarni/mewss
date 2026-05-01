import type { Article, Feed, Pagination } from "./api.ts";

export interface PaginationControlsProps {
    handlePageChange: (newPage: number) => void,
    currentPage: number,
    pagination: Pagination | undefined
}

export interface ArticleCardProps {
    article: Article
    isActive: boolean
    onClick: () => void
    onStar: (articleId: string, currentlyStarred: boolean) => void
}

export interface ReadingPaneProps {
    article: Article | null
    onBack?: () => void;
    onStar?: (articleId: string, currentlyStarred: boolean) => void;
}

export type ArticleListPanelProps = React.HTMLAttributes<HTMLDivElement> & {
    articles: Article[] | undefined;
    isLoading: boolean;
    error: Error | null;
    selectedArticleId: string | null | undefined;
    onArticleSelect: (article: Article) => void;
    unreadOnly: boolean;
    onUnreadToggle: () => void;
    handlePageChange: (newPage: number) => void;
    currentPage: number;
    currentLimit: number;
    pagination: Pagination | undefined
    activeTab: "unread" | "all"
    onTabChange: (tab: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    feedId?: string;
    onMarkAllRead: () => void;
    onStar: (articleId: string, currentlyStarred: boolean) => void;
    isStarredInbox: boolean;
}

export interface AppSidebarProps {
    selectedFeedId: string | null
    onFeedSelect: (feedId: string | null) => void
    unreadCount?: number
}

export interface FeedModalProps {
    isOpen: boolean
    onClose: () => void

    feed?: Feed // this is for the EDIT mode, optionally
}

export interface FeedModalFormProps {
    url: string,
    setUrl: (url: string) => void,
    refreshInterval: string,
    setRefreshInterval: (interval: string) => void,
    handleSubmit: (event: React.SyntheticEvent) => void,
    isSubmitting: boolean,
    formError: string | null
    handleClose: () => void

    isEditMode?: boolean
}

export interface SidebarFeedListProps {
    selectedFeedId: string | null
    onFeedSelect: (feedId: string | null) => void
}

export interface FeedItemProps {
    id: string
    url: string
    title?: string | null
    status?: string | null
    isActive: boolean
    onSelect: () => void
    onEdit: () => void
    unreadCount?: number
}

export interface FeedModalHeaderProps {
    isEditMode?: boolean
}