import {Sidebar} from '@/components/ui/sidebar.tsx'
import type {AppSidebarProps} from '@/types/props.ts'
import {SidebarHeader} from './sidebar-header.tsx'
import {SidebarMenu} from './sidebar-menu.tsx'
import {SidebarFeedList} from './sidebar-feed-list.tsx';
import {SidebarUser} from './sidebar-user.tsx';

export function AppSidebar({selectedFeedId, onFeedSelect, onFeedCreated}: AppSidebarProps) {
    return (
        <div className={"flex"}>
            <Sidebar className="border-r border-sidebar-border bg-sidebar flex flex-col h-full">
                <SidebarHeader/>
                <SidebarMenu selectedFeedId={selectedFeedId} onFeedSelect={onFeedSelect} onFeedCreated={onFeedCreated}/>
                <SidebarFeedList selectedFeedId={selectedFeedId} onFeedSelect={onFeedSelect}/>
                <SidebarUser/>
            </Sidebar>
        </div>
    )
}