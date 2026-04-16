import type {Article, Pagination} from "./api.ts";

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
}

