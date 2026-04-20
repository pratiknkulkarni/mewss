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
import { useFeeds } from '@/features/feeds/hooks/useFeeds.ts'
import { Library, Star } from 'lucide-react'
import type { AppSidebarProps } from '@/types/props.ts'
import { useUnreadCount } from '@/features/articles/hooks/useUnreadCount.ts'
import { ScrollArea } from './scroll-area.tsx';
import { NavUser } from './nav-user.tsx'

export function AppSidebar({ selectedFeedId, onFeedSelect }: AppSidebarProps) {
  const { data: feeds, isLoading } = useFeeds()
  const { data: unreadCount } = useUnreadCount()

  // Maybe I can add more? Say Archive or Not Working?
  const mainNav = [
    { title: 'All Articles', icon: Library, feedId: null },
    { title: 'Starred', icon: Star, feedId: '__starred__' }, //TODO: this needs to be changed
  ]

  const user: {
    name: string
    email: string
    avatar: string
  } = {
    avatar: "",
    name: "",
    email: ""
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar flex flex-col h-full">

      <SidebarHeader className="px-6 py-4 flex-none">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-mono text-lg tracking-tighter font-bold text-foreground">
            mewss
          </h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
            your feeds, my way
          </p>
        </div>
      </SidebarHeader>

      <div className="flex-none px-0 border-b border-border">
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
                      className={`h-4 w-4 ${isActive ? 'text-sidebar-primary' : 'text-foreground/60 opacity-80'}`}
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
      </div>

      <SidebarContent className="px-0 flex flex-col overflow-hidden flex-1 min-h-0">
        <div className="flex flex-col min-h-0 flex-1 pt-4">
          <SidebarGroup className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-start mb-4">
              <SidebarGroupLabel className="p-0 pl-2 h-auto text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                Feeds
              </SidebarGroupLabel>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {isLoading && (
                    <p className="text-[12px] text-muted-foreground/60 px-1">Loading…</p>
                  )}
                  {!isLoading && feeds?.length === 0 && (
                    <p className="text-[12px] text-muted-foreground/60 px-1">No feeds yet.</p>
                  )}
                  {feeds?.map((feed) => {
                    const isActive = selectedFeedId === feed.id
                    const cleanURL = new URL(feed.url).hostname.replace(/^www\./, "")

                    return (
                      <SidebarMenuItem key={feed.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => onFeedSelect(feed.id)}
                          className={`
                        cursor-pointer px-0 py-1.5 h-auto transition-colors group rounded-none
                        ${isActive ? 'bg-accent/40' : 'hover:bg-accent/30'}
                      `}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-4 h-4 bg-primary/10 shrink-0 flex items-center justify-center">
                                <img alt='favicon' src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanURL}&size=16`} />
                              </div>
                              <span
                                className={`text-[13px] truncate ${isActive ? 'text-primary font-medium' : 'text-foreground/80 group-hover:text-primary'}`}
                                title={feed.url}
                              >
                                {cleanURL}
                              </span>
                            </div>
                            {feed.status === 'error' && (
                              <span className="text-[10px] font-mono text-destructive shrink-0 ml-2">err</span>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </ScrollArea>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <div className="flex-none relative z-10 bg-card border-t border-border px-4 py-3">
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </div>

    </Sidebar>
  )
}