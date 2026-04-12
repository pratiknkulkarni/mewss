import { createFileRoute } from '@tanstack/react-router'
import { SidebarProvider, SidebarTrigger } from '../../../components/ui/sidebar'
import { AppSidebar } from '../../../components/ui/app-sidebar'

export const Route = createFileRoute('/_app/home/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
      </SidebarProvider>
    </div>
  )
}
