import {createFileRoute} from '@tanstack/react-router'
import {SidebarInset, SidebarProvider, SidebarTrigger} from '../../../components/ui/sidebar'
import {AppSidebar} from '../../../components/ui/app-sidebar'
import {ScrollArea} from '../../../components/ui/scroll-area'
import {useState} from 'react'
import {
    useGlobalArticles,
    // useMarkArticleRead,
} from '../../../features/articles/hooks/useArticles'
import ArticleCard from "../../../components/article/ArticleCard.tsx";

export const Route = createFileRoute('/_app/home/')({
    component: HomeComponent,
})

function HomeComponent() {
    const {data, isLoading, error} = useGlobalArticles();
    const articles = data?.articles ?? []
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
    const resolvedSelectedId = selectedArticleId ?? articles[0]?.id ?? null

    // ── Loading / error states ─────────────────────────────────────────────────
    // Keep these minimal — the centralized QueryCache handler in query-client.ts
    // already fires a sonner toast on background-refetch errors, so components
    // only need to handle the initial-load cases.
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

    return (
        <div className="overflow-y-scroll">
            <SidebarProvider>
                <SidebarInset className="flex flex-row overflow-hidden"/>
                <div className="flex h-screen w-full overflow-hidden bg-card text-foreground font-sans">
                    <AppSidebar/>
                    <div
                        className="flex-none w-[380px] bg-card border-r border-border flex flex-col h-full overflow-hidden">
                        <header
                            className="relative flex-none h-14 border-b border-border flex items-center px-5 glass sticky top-0 z-10">
                            <div className="flex items-center">
                                <SidebarTrigger/>
                            </div>
                            <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold">
                                All Articles
                            </h2>
                        </header>

                        <ScrollArea className="flex-1 min-h-0">
                            {articles.length === 0 ? (
                                <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                                    No articles yet. Add a feed to get started.
                                </p>
                            ) : (
                                articles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        isActive={resolvedSelectedId === article.id}
                                        onClick={() => {
                                        }}
                                    />
                                ))
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </SidebarProvider>
        </div>
    )
}