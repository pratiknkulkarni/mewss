import { Archive, Brain, Globe, Library, Newspaper, Palette, Rss, Star } from "lucide-react"
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
} from "./sidebar.tsx"


export function AppSidebar() {

  const mainNav = [
    { title: "All Articles", icon: Library, count: 124, isActive: true },
    { title: "Starred", icon: Star },
    { title: "Archive", icon: Archive },
  ]

  const feeds = [
    { title: "The Hindu", icon: Rss, count: 12 },
    { title: "Awesome Go Weekly", icon: Newspaper, count: 8 },
    { title: "CSS Tricks", icon: Palette, count: 24 },
    { title: "The Wall Street Journal", icon: Globe, count: 5 },
    { title: "Rain Main", icon: Brain, count: 31 },
  ]

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-xl tracking-tighter font-bold text-foreground">
            mewss
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            Some good description like "Modern Reader"
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarContent className="px-0">
          <SidebarGroup className="p-0">
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    className={`
                    flex items-center justify-between py-2 px-4 rounded-none
                    transition-all duration-150 group
                    ${item.isActive
                        ? "bg-accent/50 text-sidebar-primary font-bold border-l-2 border-sidebar-primary"
                        : "text-foreground/60 hover:bg-accent/30 pl-4.5"}
                  `}
                  >
                    <a href="#">
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-4.5 w-4.5 ${item.isActive ? "text-sidebar-primary" : "text-foreground/60 opacity-80"}`} />
                        <span className="font-sans text-[11px] uppercase tracking-widest font-medium">
                          {item.title}
                        </span>
                      </div>
                      {item.count && (
                        <span className="text-[10px] font-mono opacity-60 tabular-nums">
                          {item.count}
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <div className="mt-8">
            <SidebarGroup className="px-6">
              <div className="flex items-center justify-between mb-4">
                <SidebarGroupLabel className="p-0 h-auto text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                  Feeds
                </SidebarGroupLabel>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                  {/* <Plus className="h-4 w-4" /> */}
                </button>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {feeds.map((feed) => (
                    <SidebarMenuItem key={feed.title}>
                      <SidebarMenuButton
                        className="px-0 py-1.5 h-auto hover:bg-accent/30 transition-colors group rounded-none"
                      >
                        <a href="#" className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-4 h-4 bg-primary/10 shrink-0 flex items-center justify-center">
                              <feed.icon className="h-2.5 w-2.5 text-primary" />
                            </div>
                            <span className="text-[13px] truncate text-foreground/80 group-hover:text-primary">
                              {feed.title}
                            </span>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>

        </SidebarContent>

      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
