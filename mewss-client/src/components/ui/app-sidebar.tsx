import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './sidebar.tsx'
import { useFeeds } from '../../features/feeds/hooks/useFeeds.ts'
import { Library, Rss, Star } from 'lucide-react'
import type { AppSidebarProps } from '../../types/props.ts'
import { useUnreadCount } from '../../features/articles/hooks/useUnreadCount.ts'

export function AppSidebar({ selectedFeedId, onFeedSelect }: AppSidebarProps) {
  const { data: feeds, isLoading } = useFeeds()
  const { data: unreadCount } = useUnreadCount()

  // Maybe I can add more? Say Archive or Not Working?
  const mainNav = [
    { title: 'All Articles', icon: Library, feedId: null },
    { title: 'Starred', icon: Star, feedId: '__starred__' },
  ]

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">

      <SidebarHeader className="px-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-xl tracking-tighter font-bold text-foreground">
            mewss
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            your feeds, your way
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarContent className="px-0">

          <SidebarGroup className="p-0">
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive = item.feedId === null
                  ? selectedFeedId === null
                  : selectedFeedId === item.feedId

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        if (item.feedId === null || item.feedId === '__starred__' || item.feedId === '__archive__') {
                          onFeedSelect(null)
                        }
                      }}
                      className={`
                        flex items-center justify-between py-2 px-4 rounded-none
                        transition-all duration-150 group
                        ${isActive
                          ? 'bg-accent/50 text-sidebar-primary font-bold border-l-2 border-sidebar-primary'
                          : 'text-foreground/60 hover:bg-accent/30 pl-4.5'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`h-4.5 w-4.5 ${isActive ? 'text-sidebar-primary' : 'text-foreground/60 opacity-80'}`}
                        />
                        <span className="font-sans text-[11px] uppercase tracking-widest font-medium">
                          {item.title}
                        </span>

                        {item.feedId === null && unreadCount ? (
                          <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground/60">
                            {unreadCount}
                          </span>
                        ) : null}

                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>

          <div className="mt-8">
            <SidebarGroup className="px-6">
              <div className="flex items-center justify-between mb-4">
                <SidebarGroupLabel className="p-0 h-auto text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                  Feeds
                </SidebarGroupLabel>
              </div>

              <SidebarGroupContent>
                <SidebarMenu>
                  {/* TODO: need to replicate this or something simlar for the Articles */}
                  {isLoading && (
                    <p className="text-[12px] text-muted-foreground/60 px-1">
                      Loading…
                    </p>
                  )}

                  {!isLoading && feeds?.length === 0 && (
                    <p className="text-[12px] text-muted-foreground/60 px-1">
                      No feeds yet.
                    </p>
                  )}

                  {feeds?.map((feed) => {
                    const isActive = selectedFeedId === feed.id

                    return (
                      <SidebarMenuItem key={feed.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => onFeedSelect(feed.id)}
                          className={`
                            px-0 py-1.5 h-auto transition-colors group rounded-none
                            ${isActive ? 'bg-accent/40' : 'hover:bg-accent/30'}
                          `}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-4 h-4 bg-primary/10 shrink-0 flex items-center justify-center">
                                <Rss className="h-2.5 w-2.5 text-primary" />
                              </div>
                              <span
                                className={`text-[13px] truncate ${isActive ? 'text-primary font-medium' : 'text-foreground/80 group-hover:text-primary'}`}
                                title={feed.url}
                              >
                                {/* TODO: this works, partially. 
                                If one TLD gives multiple RSS feeds (ex - https://www.thehindu.com/rssfeeds/), all come up as "thehindu".
                                */}
                                {new URL(feed.url).hostname.replace(/^www\./, "")}
                                {/* {feed.url} */}
                              </span>
                            </div>
                            {feed.status === 'error' && (
                              <span className="text-[10px] font-mono text-destructive shrink-0 ml-2">
                                err
                              </span>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>

        </SidebarContent>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  )
}