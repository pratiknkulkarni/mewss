import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {SidebarInset, SidebarProvider} from '../../../components/ui/sidebar'
import {AppSidebar} from '../../../components/ui/app-sidebar'
import {
    useGlobalArticles,
} from '../../../features/articles/hooks/useArticles'
import ArticleListPanel from "../../../components/article/ArticleListPanel.tsx";
import {ReadingPane} from "../../../components/article/ReadingPane.tsx";
import type {Article} from "../../../types/api.ts";

export const Route = createFileRoute('/_app/home/')({
    component: HomeComponent,
})

function HomeComponent() {
    const {data, isLoading, error} = useGlobalArticles();
    // const [selectedArticleId, _] = useState<string | null>(null)
    const articles = data?.articles;
    const {unread, articleId} = Route.useSearch();
    const selectedArticle: Article | null = articles?.find((a) => a.id === articleId) ?? null
    const navigate = useNavigate({from: Route.fullPath});

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-card text-muted-foreground text-sm">
                Loading articles…
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-card text-destructive text-sm">
                {error.message}
            </div>
        )
    }
    const handleArticleSelect = (article: Article) => {
        navigate({
            search: (prev) => ({...prev, articleId: article.id}),
        })
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
                    />
                    <div className="flex flex-1 overflow-hidden">
                        <ReadingPane article={selectedArticle}/>
                    </div>
                </div>
            </SidebarProvider>
        </div>
    )
}