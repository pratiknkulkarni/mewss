import ArticleCard from "./ArticleCard.tsx";
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { PaginationControls } from "./PaginationControls.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import type { ArticleListPanelProps } from "@/types/props.ts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";
import { CheckCheck, RefreshCw } from "lucide-react";
import { Button } from "../ui/button.tsx";

export default function ArticleListPanel({
    articles,
    isLoading,
    error,
    selectedArticleId,
    onArticleSelect,
    handlePageChange,
    currentPage,
    pagination,
    className,
    activeTab,
    onTabChange,
    isRefreshing,
    onRefresh,
    feedId,
    onMarkAllRead: markAllRead,
}: ArticleListPanelProps) {

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <p className="text-sm font-medium text-destructive">Failed to load articles.</p>
                <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
            </div>
        )
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    // moving this from a component to a variable due to re-mounting.
    const listContent = (
        <ScrollArea className="flex-1 h-full" key={`${activeTab}-${currentPage}`}>
            {isLoading && <div className="p-4 text-center text-sm">loading...</div>}

            {!isLoading && !error && (!articles || articles.length === 0) && (
                <div className="px-5 py-12 text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                        {activeTab === "unread" ? "You're all caught up. Touch some grass." : "No articles found."}
                    </p>
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
    )

    return (
        <div
            className={`flex-none w-full md:w-95 bg-card border-r border-border flex flex-col h-full overflow-hidden ${className ?? ""}`}>

            <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col flex-1 min-h-0">
                <header
                    className="relative flex-none h-14 border-b border-border flex items-center px-4 justify-between sticky top-0 z-10 bg-card">
                    <div className="flex items-center">
                        <SidebarTrigger />
                    </div>

                    <TabsList className="h-9">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                    </TabsList>

                    <TooltipProvider delay={400}>
                        <div className="flex items-center gap-0.5">
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={onRefresh}
                                        disabled={isRefreshing}
                                        aria-label="Refresh"
                                    >
                                        <RefreshCw
                                            className={cn(
                                                'size-4 text-muted-foreground',
                                                isRefreshing && 'animate-spin',
                                            )}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {feedId ? 'Refresh this feed' : 'Refresh all feeds'}
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={markAllRead} //TODO: rename this
                                        aria-label="Mark as read"
                                    >
                                        <CheckCheck
                                            className={cn(
                                                'size-4 text-muted-foreground',
                                            )}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {feedId ? 'Mark this feed as read' : 'Mark ALL feeds as read'}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                </header>

                <TabsContent value="unread"
                    className="m-0 border-none outline-none flex-1 min-h-0 flex-col data-[state=active]:flex">
                    {listContent}
                </TabsContent>

                <TabsContent value="all"
                    className="m-0 border-none outline-none flex-1 min-h-0 flex-col data-[state=active]:flex">
                    {listContent}
                </TabsContent>
            </Tabs>

            <div className="flex-none relative z-10 bg-card border-t border-border px-4 py-3">
                <PaginationControls pagination={pagination} handlePageChange={handlePageChange}
                    currentPage={currentPage} />
            </div>
        </div >
    )
}