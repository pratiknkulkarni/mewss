import { ScrollArea } from "@/components/ui/scroll-area"
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFeeds } from "@/features/feeds/hooks/useFeeds"
import { MoreHorizontal, Trash2, PencilIcon, RefreshCw, CheckCheckIcon } from "lucide-react"
import { useState } from "react"
import type { FeedItemProps, SidebarFeedListProps } from "@/types/props"
import { useRefreshFeed } from "@/features/feeds/hooks/useRefreshFeed"
import { useMarkAllRead } from "@/features/feeds/hooks/useMarkAllRead"
import { toast } from "sonner"
import { useDeleteFeed } from "@/features/feeds/hooks/useDeleteFeed"
import { useNavigate } from "@tanstack/react-router"
import { useConfirm } from "@/hooks/use-confirm.ts";
import type { Feed } from "@/types/api.ts";
import { FeedModal } from "@/components/feed/feed-modal.tsx";

function FeedItem({ id, url, title, status, isActive, onSelect, onEdit }: FeedItemProps) {
    const [hovered, setHovered] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    const hostname = new URL(url).hostname.replace(/^www\./, "")
    const faviconURL = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=16`
    const label = title || hostname

    const showEllipsis = hovered || menuOpen

    const { mutate: refreshMutate } = useRefreshFeed();
    const { mutate: markAllReadMutate } = useMarkAllRead();
    const { mutate: deleteFeedMutate } = useDeleteFeed();

    const navigate = useNavigate();

    function handleRefreshFeed() {
        refreshMutate([id])
        toast.success("Feed refresh queued", { position: 'bottom-right' })
    }

    function handleMarkFeedRead() {
        markAllReadMutate(id)
        toast.success("Mark Feed Read Queued", { position: 'bottom-right' })
    }

    const confirm = useConfirm()

    async function handleDeleteFeedConfirmation() {
        const confirmed = await confirm({
            title: "Delete feed?",
            description: "This will permanently remove the feed and all its articles. This cannot be undone.",
            confirmLabel: "Delete",
            destructive: true,
        });

        if (!confirmed) return

        deleteFeedMutate(id)
        toast.success("Feed deleted", { position: "bottom-right" })
        navigate({ to: "/home", replace: true })
    }

    return (
        <SidebarMenuItem
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <button
                onClick={onSelect}
                className={`
                    group w-full flex items-center gap-2
                    px-3 py-1.5 rounded-md
                    text-left text-[13px] leading-snug
                    cursor-pointer select-none
                    transition-colors duration-100
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
                    hover:bg-accent/30 hover:text-foreground
                    ${isActive
                        ? "bg-accent/60 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                    }
                `}
            >
                <img
                    src={faviconURL}
                    alt=""
                    aria-hidden="true"
                    className="w-3.5 h-3.5 shrink-0 rounded-[3px] opacity-80"
                    onError={(e) => {
                        ; (e.target as HTMLImageElement).style.display = "none"
                    }}
                />

                <span className="truncate flex-1 min-w-0">{label}</span>

                {status === "error" && (
                    <span
                        className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-wide text-destructive/80 bg-destructive/10 px-1 py-0.5 rounded">
                        err
                    </span>
                )}

                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger>
                        <span
                            role="button"
                            aria-label="Feed options"
                            onClick={(e) => e.stopPropagation()}
                            className={`
                                shrink-0 flex h-5 w-5 items-center justify-center rounded-md
                                text-muted-foreground/70
                                hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10
                                focus-visible:outline-none
                                transition-opacity duration-100
                                ${showEllipsis ? "opacity-100" : "opacity-0 pointer-events-none"}
                            `}
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </span>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        side="bottom"
                        align="end"
                        sideOffset={4}
                        className="w-44 rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenuItem className="gap-2 cursor-pointer text-[13px]" onClick={onEdit}>
                            <PencilIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            Edit feed
                        </DropdownMenuItem>

                        <DropdownMenuItem className="gap-2 cursor-pointer text-[13px]" onClick={handleRefreshFeed}>
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh feed
                        </DropdownMenuItem>

                        <DropdownMenuItem className="gap-2 cursor-pointer text-[13px]" onClick={handleMarkFeedRead}>
                            <CheckCheckIcon className="h-3.5 w-3.5" />
                            Mark feed read
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-[13px] text-destructive focus:text-destructive"
                            onClick={handleDeleteFeedConfirmation}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete feed
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </button>
        </SidebarMenuItem>
    )
}

export function SidebarFeedList({ selectedFeedId, onFeedSelect }: SidebarFeedListProps) {
    const { data: feeds, isLoading } = useFeeds()
    const [editingFeed, setEditingFeed] = useState<Feed | null>(null);

    return (
        <SidebarContent className="flex flex-col flex-1 min-h-0 overflow-hidden px-0">
            <SidebarGroup className="flex flex-col flex-1 min-h-0 pt-4 gap-0">

                <SidebarGroupLabel className="
                    px-3 mb-2 h-auto
                    text-[10px] uppercase tracking-[0.2em] font-semibold
                    text-muted-foreground/60
                ">
                    Feeds
                </SidebarGroupLabel>

                <SidebarGroupContent className="flex flex-col flex-1 min-h-0">
                    <ScrollArea className="flex-1 min-h-0">
                        <SidebarMenu className="gap-0.5 px-2">

                            {isLoading && Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-8 mx-1 my-0.5 rounded-md bg-muted/40 animate-pulse"
                                    style={{ opacity: 1 - i * 0.2 }}
                                />
                            ))}

                            {!isLoading && feeds?.length === 0 && (
                                <p className="px-3 py-2 text-[12px] text-muted-foreground/50 italic">
                                    No feeds yet. Add one above.
                                </p>
                            )}

                            {feeds?.map((feed) => (
                                <FeedItem
                                    key={feed.id}
                                    id={feed.id}
                                    url={feed.url}
                                    title={feed.title}
                                    status={feed?.status}
                                    isActive={selectedFeedId === feed.id}
                                    onSelect={() => onFeedSelect(feed.id)}
                                    onEdit={() => setEditingFeed(feed)}
                                />
                            ))}

                        </SidebarMenu>
                    </ScrollArea>
                </SidebarGroupContent>

            </SidebarGroup>

            <FeedModal isOpen={Boolean(editingFeed)}
                onClose={() => setEditingFeed(null)}
                feed={editingFeed ?? undefined}
                key={editingFeed?.id || 'new'} />

        </SidebarContent>
    )
}