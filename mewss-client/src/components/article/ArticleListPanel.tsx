import ArticleCard from "./ArticleCard.tsx";
import {SidebarTrigger} from "../ui/sidebar.tsx";
import {ScrollArea} from "../ui/scroll-area.tsx";
import {PaginationControls} from "./PaginationControls.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../ui/tabs.tsx";
import type {ArticleListPanelProps} from "../../types/props.ts";

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
                                             onTabChange
                                         }: ArticleListPanelProps) {

    //TODO: extract this out
    const ListContent = () => (
        <ScrollArea className="flex-1 h-full">
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
            className={`flex-none w-full md:w-[380px] bg-card border-r border-border flex flex-col h-full overflow-hidden ${className ?? ""}`}>

            <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col flex-1 min-h-0">
                <header
                    className="relative flex-none h-14 border-b border-border flex items-center px-4 justify-between sticky top-0 z-10 bg-card">
                    <div className="flex items-center">
                        <SidebarTrigger/>
                    </div>

                    <TabsList className="h-9">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                    </TabsList>

                    <div className="w-6"/>
                </header>

                <TabsContent value="unread"
                             className="m-0 border-none outline-none flex-1 min-h-0 flex-col data-[state=active]:flex">
                    <ListContent/>
                </TabsContent>

                <TabsContent value="all"
                             className="m-0 border-none outline-none flex-1 min-h-0 flex-col data-[state=active]:flex">
                    <ListContent/>
                </TabsContent>
            </Tabs>

            <div className="flex-none relative z-10 bg-card border-t border-border px-4 py-3">
                <PaginationControls pagination={pagination} handlePageChange={handlePageChange}
                                    currentPage={currentPage}/>
            </div>
        </div>
    )
}