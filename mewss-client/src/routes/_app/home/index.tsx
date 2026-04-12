import { createFileRoute } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../../../components/ui/sidebar'
import { AppSidebar } from '../../../components/ui/app-sidebar'

export const Route = createFileRoute('/_app/home/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div>
      <SidebarProvider>
        <SidebarInset className="flex flex-row overflow-hidden"></SidebarInset>
        <div className="flex h-screen w-full overflow-hidden bg-card text-foreground font-sans">
          <AppSidebar />
          <div className="flex-none w-[380px] bg-card border-r border-border flex flex-col h-full overflow-hidden">
            <header className="relative flex-none h-14 border-b border-border flex items-center px-5 glass sticky top-0 z-10">
              <div className="flex items-center">
                <SidebarTrigger />
              </div>
              <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold">
                All Articles
              </h2>
            </header>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
