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
    // validateSearch: (search) => ({
    //     page: search.page ? Number(search.page) : undefined,
    //     limit: search.limit ? Number(search.limit) : undefined,
    //     unread:
    //         search.unread === undefined
    //             ? undefined
    //             : search.unread !== false && search.unread !== 'false',
    //     articleId:
    //         typeof search.articleId === 'string'
    //             ? search.articleId
    //             : undefined,
    // }),
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
    // const [selectedArticleId, _] = useState<string | null>(null)
    const articles = data?.articles;
    // const selectedArticle: Article | null = articles?.find((a) => a.id === articleId) ?? null
    const selectedArticle = articles?.find((a) => a.id === selectedArticleId) ?? null

    // const navigate = useNavigate({from: Route.fullPath});

    function handlePageChange(newPage: number) {
        // navigate({
        //     search: (prev) => ({...prev, page: newPage}),
        // })
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

    console.log(unread, articleId, limit, page, selectedArticle, selectedArticleId);

    // if (isLoading) {
    //     return (
    //         <div className="flex h-screen w-full items-center justify-center bg-card text-muted-foreground text-sm">
    //             Loading articles…
    //         </div>
    //     )
    // }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-card text-destructive text-sm">
                {error.message}
            </div>
        )
    }
    const handleArticleSelect = (article: Article) => {
        // navigate({
        //     search: (prev) => ({...prev, articleId: article.id}),
        // })
        setSelectedArticleId(article.id)
    }
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
                        selectedArticleId={articleId ?? null}
                        onArticleSelect={handleArticleSelect}
                        unreadOnly={unread}
                        onUnreadToggle={handleUnreadToggle}
                        handlePageChange={handlePageChange}
                        currentPage={page}
                        currentLimit={limit}
                    />
                    <div className="flex flex-1 overflow-hidden">
                        <ReadingPane article={selectedArticle}/>
                    </div>
                </div>
            </SidebarProvider>
        </div>
    )
}