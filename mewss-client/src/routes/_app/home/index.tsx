import {createFileRoute} from '@tanstack/react-router'
import {SidebarInset, SidebarProvider} from '../../../components/ui/sidebar'
import {AppSidebar} from '../../../components/ui/app-sidebar'
import {
    useGlobalArticles,
} from '../../../features/articles/hooks/useArticles'
import ArticleListPanel from "../../../components/article/ArticleListPanel.tsx";
import {ReadingPane} from "../../../components/article/ReadingPane.tsx";
import type {Article} from "../../../types/api.ts";
import {useState} from "react";

export const Route = createFileRoute('/_app/home/')({
    component: HomeComponent,
})

function HomeComponent() {
    const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null)
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const {unread, articleId} = Route.useSearch();
    const {data, isLoading, error} = useGlobalArticles({
        page,
        limit,
        unread: selectedFeedId === null,
        feedId: selectedFeedId ?? undefined,
    });

    console.log(data?.pagination)

    const articles = data?.articles;
    const selectedArticle = articles?.find((a) => a.id === selectedArticleId) ?? null

    function handlePageChange(newPage: number) {
        setPage(newPage);
    }

    function handleFeedSelect(feedId: string | null) {
        setSelectedFeedId(feedId)
        setSelectedArticleId(null) // clear reading pane on feed switch so it doesnt display old article
        setPage(1)
    }

    function handleLimitChange(newLimit: number) {
        setLimit(newLimit)
        setPage(1)
    }

    // console.log(unread, articleId, limit, page, selectedArticle, selectedArticleId);

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-card text-destructive text-sm">
                {error.message}
            </div>
        )
    }

    const handleArticleSelect = (article: Article) => {
        setSelectedArticleId(article.id);
    }

    // mark the feed as "read" here
    const handleUnreadToggle = () => {
    }

    return (
        <div className="overflow-y-scroll">
            <SidebarProvider>
                <SidebarInset className="flex flex-row overflow-hidden"/>
                <div className="flex h-screen w-full overflow-hidden bg-card text-foreground font-sans">
                    <AppSidebar/>
                    <ArticleListPanel
                        title="All Articles"
                        articles={articles}
                        isLoading={isLoading}
                        error={error}
                        selectedArticleId={selectedArticleId}
                        onArticleSelect={handleArticleSelect}
                        unreadOnly={unread}
                        onUnreadToggle={handleUnreadToggle}
                        handlePageChange={handlePageChange}
                        currentPage={page}
                        currentLimit={limit}
                        pagination={data?.pagination}
                        className="flex-1 w-full md:flex-none md:w-80 lg:w-96"
                    />
                    <div className="md:flex md:flex-1 md:overflow-hidden hidden">
                        <ReadingPane article={selectedArticle}/>
                    </div>
                </div>
            </SidebarProvider>
        </div>
    )
}