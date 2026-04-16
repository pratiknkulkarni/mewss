import type {Article} from "../../types/api.ts";
import ArticleCard from "./ArticleCard.tsx";
import {SidebarTrigger} from "../ui/sidebar.tsx";
import {ScrollArea} from "../ui/scroll-area.tsx";
import {PaginationControls} from "./PaginationControls.tsx";

type ArticleListPanelProps = React.HTMLAttributes<HTMLDivElement> & {
    title: string;
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
}


export default function ArticleListPanel({
                                             title,
                                             articles,
                                             isLoading,
                                             error,
                                             selectedArticleId,
                                             onArticleSelect,
                                             unreadOnly,
                                             onUnreadToggle,
                                             handlePageChange,
                                             currentPage,
                                             className
                                         }: ArticleListPanelProps) {


    if (isLoading) {
        console.log("we are loading")
    }

    return <div
        className={`flex-none w-[380px] bg-card border-r border-border flex flex-col h-full overflow-hidden ${className ?? ""}`}>
        <header
            className="relative flex-none h-14 border-b border-border flex items-center px-4 sticky top-0 z-10 bg-card">
            <div className="flex items-center">
                <SidebarTrigger/>
            </div>

            <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold truncate max-w-[160px]">
                {title}
            </h2>
        </header>

        <ScrollArea className="flex-1 min-h-0">
            {error && !isLoading && (
                <p className="px-5 py-8 text-sm text-destructive text-center">
                    {error}
                </p>
            )}

            {isLoading && <div>loading...</div>}

            {!isLoading && !error && articles?.length === 0 && (
                <div className="px-5 py-12 text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                        {unreadOnly ? "You're all caught up." : "No articles yet."}
                    </p>
                    {unreadOnly && (
                        <button
                            onClick={onUnreadToggle}
                            className="text-xs text-primary hover:underline"
                        >
                            Show all articles
                        </button>
                    )}
                </div>
            )}

            {!isLoading &&
                articles?.map((article) => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                        isActive={selectedArticleId === article.id}
                        onClick={() => onArticleSelect(article)}
                    />
                ))}
        </ScrollArea>
        <div className="flex-none border-t border-border px-4 py-3 bg-card">
            <PaginationControls handlePageChange={handlePageChange} currentPage={currentPage}/>
        </div>
    </div>
}