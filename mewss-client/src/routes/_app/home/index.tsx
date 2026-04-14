import {createFileRoute} from '@tanstack/react-router'
import {SidebarInset, SidebarProvider} from '../../../components/ui/sidebar'
import {AppSidebar} from '../../../components/ui/app-sidebar'
import {
    useGlobalArticles,
} from '../../../features/articles/hooks/useArticles'
import ArticleListPanel from "../../../components/article/ArticleListPanel.tsx";

export const Route = createFileRoute('/_app/home/')({
    component: HomeComponent,
})

function HomeComponent() {
    const {data, isLoading, error} = useGlobalArticles();
    // const [selectedArticleId, _] = useState<string | null>(null)
    const articles = data?.articles;
    const {unread, articleId} = Route.useSearch();

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
    const handleArticleSelect = () => {
        console.log("selecting article")
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

                    {/*<div*/}
                    {/*    className="flex-none w-[380px] bg-card border-r border-border flex flex-col h-full overflow-hidden">*/}
                    {/*    <header*/}
                    {/*        className="relative flex-none h-14 border-b border-border flex items-center px-5 glass sticky top-0 z-10">*/}
                    {/*        <div className="flex items-center">*/}
                    {/*            <SidebarTrigger/>*/}
                    {/*        </div>*/}
                    {/*        <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold">*/}
                    {/*            All Articles*/}
                    {/*        </h2>*/}
                    {/*    </header>*/}

                    {/*    <ScrollArea className="flex-1 min-h-0">*/}
                    {/*        {articles.length === 0 ? (*/}
                    {/*            <p className="px-5 py-8 text-sm text-muted-foreground text-center">*/}
                    {/*                No articles yet. Add a feed to get started.*/}
                    {/*            </p>*/}
                    {/*        ) : (*/}
                    {/*            articles.map((article) => (*/}
                    {/*                <ArticleCard*/}
                    {/*                    key={article.id}*/}
                    {/*                    article={article}*/}
                    {/*                    isActive={resolvedSelectedId === article.id}*/}
                    {/*                    onClick={() => {*/}
                    {/*                    }}*/}
                    {/*                />*/}
                    {/*            ))*/}
                    {/*        )}*/}
                    {/*    </ScrollArea>*/}
                    {/*</div>*/}
                </div>
            </SidebarProvider>
        </div>
    )
}