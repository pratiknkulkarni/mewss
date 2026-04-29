import {useState} from "react"
import {useUnreadCount} from "@/features/articles/hooks/useUnreadCount"
import {SidebarMenu as Menu, SidebarMenuButton, SidebarMenuItem} from "../ui/sidebar"
import {Library, Star, PlusCircle} from 'lucide-react'
import {FeedModal} from "../feed/feed-modal"

export function SidebarMenu({
                                selectedFeedId,
                                onFeedSelect
                            }: {
    selectedFeedId: string | null,
    onFeedSelect: (feedId: string | null) => void
}) {
    const {data: unreadCount} = useUnreadCount()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const getMenuClasses = (isActive: boolean) => `
        cursor-pointer flex items-center justify-between py-2 px-4 rounded-none
        transition-all duration-150 group
        ${isActive
        ? 'bg-accent/50 text-sidebar-primary font-bold border-l-2 border-sidebar-primary'
        : 'text-foreground/60 hover:bg-accent/30 pl-4.5'
    }
    `

    return (
        <>
            <div className="flex-none px-0 border-b border-border">
                <Menu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            isActive={selectedFeedId === null}
                            onClick={() => onFeedSelect(null)}
                            className={getMenuClasses(selectedFeedId === null)}
                        >
                            <div className="flex items-center gap-3">
                                <Library
                                    className={`h-4 w-4 ${selectedFeedId === null ? 'text-sidebar-primary' : 'text-foreground/60 opacity-80'}`}/>
                                <span className="font-sans text-[11px] uppercase tracking-widest font-medium">
                                    All Articles
                                </span>
                                {unreadCount ? (
                                    <span
                                        className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground/60">
                                        {unreadCount}
                                    </span>
                                ) : null}
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            isActive={selectedFeedId === '__starred__'}
                            onClick={() => onFeedSelect('__starred__')}
                            className={getMenuClasses(selectedFeedId === '__starred__')}
                        >
                            <div className="flex items-center gap-3">
                                <Star
                                    className={`h-4 w-4 ${selectedFeedId === '__starred__' ? 'text-sidebar-primary' : 'text-foreground/60 opacity-80'}`}/>
                                <span className="font-sans text-[11px] uppercase tracking-widest font-medium">
                                    Starred
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            isActive={false}
                            onClick={() => setIsAddModalOpen(true)}
                            className={getMenuClasses(false)}
                        >
                            <div className="flex items-center gap-3">
                                <PlusCircle className="h-4 w-4 text-foreground/60 opacity-80"/>
                                <span className="font-sans text-[11px] uppercase tracking-widest font-medium">
                                    Add Feed
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </Menu>
            </div>

            <FeedModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}/>

        </>
    )
}