import type { Article, Pagination } from "./api.ts";

export interface PaginationControlsProps {
    handlePageChange: (newPage: number) => void,
    currentPage: number,
    pagination: Pagination | undefined
}

export interface ArticleCardProps {
    article: Article
    isActive: boolean
    onClick: () => void
}

export interface ReadingPaneProps {
    article: Article | null
    onBack?: () => void;
}

export type ArticleListPanelProps = React.HTMLAttributes<HTMLDivElement> & {
    articles: Article[] | undefined;
    isLoading: boolean;
    error: string | null;
    selectedArticleId: string | null;
    onArticleSelect: (article: Article) => void;
    unreadOnly: boolean;
    onUnreadToggle: () => void;
    handlePageChange: (newPage: number) => void;
    currentPage: number;
    currentLimit: number;
    pagination: Pagination | undefined
    activeTab: "unread" | "all"
    onTabChange: (tab: string) => void;
}

export interface AppSidebarProps {
    selectedFeedId: string | null
    onFeedSelect: (feedId: string | null) => void
}
