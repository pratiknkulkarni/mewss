import { createFileRoute } from '@tanstack/react-router'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar/app-sidebar'
import { useArticles } from '@/features/articles/hooks/useArticles'
import ArticleListPanel from "@/components/article/ArticleListPanel.tsx";
import { ReadingPane } from "@/components/article/ReadingPane.tsx";
import type { Article } from "@/types/api.ts";
import { useMarkArticleRead } from "@/features/articles/hooks/useMarkArticleRead.ts";
import { useRefreshFeed } from '@/features/feeds/hooks/useRefreshFeed';
import { useFeeds } from '@/features/feeds/hooks/useFeeds';
import { toast } from 'sonner';
import { useMarkAllRead } from '@/features/feeds/hooks/useMarkAllRead';
import { useStarArticle } from '@/features/articles/hooks/useStarArticle';

export const Route = createFileRoute('/_app/home/')({
    validateSearch: (search: Record<string, unknown>) => {
        // I am setting values to undefined so that on the "first load" it won't have URL params
        return {
            articleId: search.articleId as string | undefined,
            feedId: search.feedId as string | undefined,
            tab: search.tab as 'unread' | 'all' | undefined,
            page: search.page ? Number(search.page) : undefined,
            limit: search.limit ? Number(search.limit) : undefined,
        }
    },
    component: HomeComponent,
})


type SearchParams = {
    tab?: "unread" | "all" | undefined;
    page?: number;
    articleId?: string;
}

function HomeComponent() {
    //TODO: I am hardcoding the limit to 20 for now
    const { articleId, feedId, tab = "unread", page = 1, limit = 20 } = Route.useSearch();

    const navigate = Route.useNavigate()

    const isStarredInbox = feedId === '__starred__'
    const realFeedId = isStarredInbox ? undefined : feedId

    const { data, isLoading, error } = useArticles({
        page,
        limit,
        unread: isStarredInbox ? undefined : tab === "unread",
        feedId: realFeedId,
        starred: isStarredInbox ? true : undefined,
    });

    const {
        mutate: markArticleReadMutate,
    } = useMarkArticleRead();

    const { mutate: refreshMutate, isPending: isRefreshing } = useRefreshFeed();
    const { mutate: markAllReadMutate } = useMarkAllRead();
    const { data: feeds } = useFeeds(); // required for refreshing...
    const { mutate: starMutate } = useStarArticle();

    const articles = data?.articles;
    const selectedArticle = articles?.find((a) => a.id === articleId) ?? null // user "clicked" article

    // when usere clicks on a Next/Previous
    const handlePageChange = (newPage: number) => {
        navigate({ search: (prev: SearchParams) => ({ ...prev, page: newPage }) })
    }

    // when user "clicks" on an article, it marks as read by default
    const handleArticleSelect = (article: Article) => {
        markArticleReadMutate(article.id)

        navigate({
            search: (prev: SearchParams) => ({ ...prev, articleId: article.id }),
            resetScroll: false,
        })
    }

    // when user toggles between "Unread"(default)/"All"
    const handleTabChange = (newTab: string) => {
        navigate({
            search: (prev: SearchParams) => ({
                ...prev,

                tab: newTab,
                page: 1,
                articleId: undefined
            })
        })
    }

    // when user marks the feed as "Unread", preferrably right click and select that from the dropdown, preferrably right click and select that from the dropdown
    const handleUnreadToggle = () => {
    }

    const handleFeedSelect = (newFeedId: string | null) => {
        navigate({
            search: (prev: SearchParams) => ({
                ...prev,
                feedId: newFeedId ?? undefined,
                articleId: undefined,
                page: 1,
            }),
        })
    }
    const handleRefresh = () => {
        if (feedId) {
            refreshMutate([feedId])
            toast.success("Refresh Feed Queued", { position: 'bottom-right' })
        } else {
            const allIds = feeds?.map((f) => f.id) ?? []
            if (allIds.length > 0) refreshMutate(allIds)
            toast.success("Refresh Feed Queued", { position: 'bottom-right' })
        }
    }

    const handleMarkAllRead = () => {
        if (feedId) {
            markAllReadMutate(feedId)
            toast.success("Mark All Read Queued", { position: 'bottom-right' })
        } else {
            markAllReadMutate(null)
            toast.success("Mark All Read Queued", { position: 'bottom-right' })
        }
    }

    const handleStar = (articleId: string, currentlyStarred: boolean) => {
        starMutate({ articleId, currentlyStarred })
    }

    // I have yet to test this out
    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-card text-destructive text-sm">
                {error.message}
            </div>
        )
    }

    return (
        <SidebarProvider>
            {/* <SidebarInset className="flex flex-row overflow-hidden" /> */}
            <div className="flex h-screen w-full overflow-hidden bg-card text-foreground font-sans">
                <AppSidebar selectedFeedId={feedId ?? null}
                    onFeedSelect={handleFeedSelect}
                    unreadCount={data?.pagination?.total}
                />
                <ArticleListPanel
                    articles={articles}
                    isLoading={isLoading}
                    error={error}
                    selectedArticleId={articleId}
                    onArticleSelect={handleArticleSelect}
                    unreadOnly={tab === "unread"}
                    onUnreadToggle={handleUnreadToggle}
                    handlePageChange={handlePageChange}
                    currentPage={page}
                    currentLimit={limit}
                    pagination={data?.pagination}
                    className={`w-full md:w-80 lg:w-96 ${articleId ? 'hidden md:flex' : 'flex'} flex-col`}
                    activeTab={tab}
                    onTabChange={handleTabChange}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    feedId={feedId ?? undefined}
                    onMarkAllRead={handleMarkAllRead}
                    onStar={handleStar}
                    isStarredInbox={isStarredInbox}
                />

                <div className={`flex-1 overflow-hidden ${articleId ? 'flex' : 'hidden md:flex'}`}>
                    <ReadingPane
                        article={selectedArticle}
                        onBack={() => navigate({ search: (prev: SearchParams) => ({ ...prev, articleId: undefined }) })}
                    />
                </div>
            </div>
        </SidebarProvider>
    )
}
