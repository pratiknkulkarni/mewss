import { Sidebar } from '../ui/sidebar.tsx'
import type { AppSidebarProps } from '@/types/props.ts'
import { SidebarHeader } from './sidebar-header.tsx'
import { SidebarMenu } from './sidebar-menu.tsx'
import { SidebarFeedList } from './sidebar-feed-list.tsx';
import { SidebarUser } from './sidebar-user.tsx';

export function AppSidebar({ selectedFeedId, onFeedSelect }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar flex flex-col h-full">
      <SidebarHeader />
      <SidebarMenu selectedFeedId={selectedFeedId} onFeedSelect={onFeedSelect} />
      <SidebarFeedList selectedFeedId={selectedFeedId} onFeedSelect={onFeedSelect} />
      <SidebarUser />
    </Sidebar>
  )
}