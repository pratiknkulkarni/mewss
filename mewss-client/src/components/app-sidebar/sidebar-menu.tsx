import { useUnreadCount } from "@/features/articles/hooks/useUnreadCount"
import { SidebarMenu as Menu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar"
import { Library, Star, PlusCircle } from 'lucide-react'

export function SidebarMenu({ selectedFeedId, onFeedSelect }: { selectedFeedId: string | null, onFeedSelect: (feedId: string | null) => void }) {
    //TODO: Maybe I can add more? Say Archive or Not Working?
    const mainNav = [
        { title: 'All Articles', icon: Library, feedId: null },
        { title: 'Starred', icon: Star, feedId: '__starred__' }, //TODO: this needs to be changed
        { title: 'Add Feed', icon: PlusCircle, feedId: '__add_feed__' }, //TODO: this needs to be changed
    ]

    const { data: unreadCount } = useUnreadCount()

    return (
        <div className="flex-none px-0 border-b border-border">
            <Menu>
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
                cursor-pointer flex items-center justify-between py-2 px-4 rounded-none
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
            </Menu>
        </div>
    )
}