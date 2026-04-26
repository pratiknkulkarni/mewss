import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "../ui/scroll-area"
import { SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "../ui/sidebar"
import { useFeeds } from "@/features/feeds/hooks/useFeeds"

export function SidebarFeedList({ selectedFeedId, onFeedSelect }: { selectedFeedId: string | null, onFeedSelect: (feedId: string | null) => void }) {
    const { data: feeds, isLoading } = useFeeds()
    return (
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
                                    const faviconURL = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanURL}&size=16`

                                    return (
                                        <SidebarMenuItem className="cursor-pointer" key={feed.id}>
                                            <TooltipProvider delay={400}>
                                                <Tooltip>
                                                    <SidebarMenuButton
                                                        isActive={isActive}
                                                        onClick={() => onFeedSelect(feed.id)}
                                                        className={`
                        cursor-pointer px-0 py-1.5 h-auto transition-colors group rounded-none
                        ${isActive ? 'bg-accent/40' : 'hover:bg-accent/30'}
                      `}
                                                    >
                                                        <TooltipTrigger>
                                                            <div className="max-w-40 flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="w-4 h-4 bg-primary/10 shrink-0 flex items-center justify-center">
                                                                        <img alt='favicon' src={faviconURL} />
                                                                    </div>
                                                                    <span
                                                                        className={`cursor-pointer text-[13px] truncate ${isActive ? 'text-primary font-medium' : 'text-foreground/80 group-hover:text-primary'}`}
                                                                        title={feed.url}
                                                                    >
                                                                        {feed?.title || cleanURL}
                                                                    </span>
                                                                </div>
                                                                {feed.status === 'error' && (
                                                                    <span className="text-[10px] font-mono text-destructive shrink-0 ml-2">err</span>
                                                                )}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {feed?.title || cleanURL}
                                                        </TooltipContent>
                                                    </SidebarMenuButton>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </ScrollArea>
                </SidebarGroup>
            </div>
        </SidebarContent >

    )
}