import {Sidebar} from '@/components/ui/sidebar.tsx'
import type {AppSidebarProps} from '@/types/props.ts'
import {SidebarHeader} from './sidebar-header.tsx'
import {SidebarMenu} from './sidebar-menu.tsx'
import {SidebarFeedList} from './sidebar-feed-list.tsx';
import {SidebarUser} from './sidebar-user.tsx';
import {useNavigate, useSearch} from "@tanstack/react-router";

export function AppSidebar({
                               selectedFeedId,
                               onFeedSelect,
                               onFeedCreated,
                               onAddFeedClick,
                               isKeyboardFocused,
                               keyboardSelectedIndex = -1
                           }: AppSidebarProps) {
    const navigate = useNavigate();
    const search = useSearch({strict: false});

    const resolvedFeedId = selectedFeedId ?? (search.feedId as string | undefined) ?? null

    const handleFeedSelect = (id: string | null) => {
        if (onFeedSelect) {
            onFeedSelect(id)
        } else {
            navigate({to: '/home', search: {feedId: id ?? undefined, page: 1, articleId: undefined}})
        }
    }

    const handleFeedCreated = (id: string) => {
        if (onFeedCreated) {
            onFeedCreated(id)  // HomeComponent's version with startWatching
        } else {
            navigate({to: '/home', search: {feedId: id, page: 1, articleId: undefined}})
        }
    }

    const handleAddFeedClick = onAddFeedClick ?? (() => {
    })


    return (
        <div className={"flex relative"}>
            {isKeyboardFocused && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-primary z-20 rounded-t"/>
            )}
            <Sidebar className="border-r border-sidebar-border bg-sidebar flex flex-col h-full">
                <SidebarHeader/>
                <SidebarMenu selectedFeedId={resolvedFeedId} onFeedSelect={handleFeedSelect}
                             onFeedCreated={handleFeedCreated} onAddFeedClick={handleAddFeedClick}/>
                <SidebarFeedList selectedFeedId={resolvedFeedId} onFeedSelect={handleFeedSelect}
                                 keyboardSelectedIndex={keyboardSelectedIndex} isKeyboardFocused={isKeyboardFocused}/>
                <SidebarUser/>
            </Sidebar>
        </div>
    )
}