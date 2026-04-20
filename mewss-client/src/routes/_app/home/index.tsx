import { createFileRoute } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { useArticles } from '@/features/articles/hooks/useArticles'
import ArticleListPanel from "@/components/article/ArticleListPanel.tsx";
import { ReadingPane } from "@/components/article/ReadingPane.tsx";
import type { Article } from "@/types/api.ts";
import { useMarkArticleRead } from "@/features/articles/hooks/useMarkArticleRead.ts";
import { authClient } from '@/features/auth/api/auth-client';

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
  //TODO: update limit to set to the dropdown instead of hardcoding
  const { articleId, feedId, tab = "unread", page = 1, limit = 20 } = Route.useSearch();

  const navigate = Route.useNavigate()

  const { data, isLoading, error } = useArticles({
    page,
    limit,
    unread: tab === "unread",
    feedId: feedId
  });

  const {
    mutate: markArticleReadMutate,
  } = useMarkArticleRead();

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
      <SidebarInset className="flex flex-row overflow-hidden" />
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
