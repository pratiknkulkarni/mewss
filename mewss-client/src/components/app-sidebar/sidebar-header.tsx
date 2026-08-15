import { SidebarHeader as SidebarTitle } from "../ui/sidebar"

export function SidebarHeader() {
    return (
        <SidebarTitle className="px-6 py-4 flex-none">
            <div className="flex flex-col gap-0.5">
                <h1 className="font-mono text-lg tracking-tighter font-bold text-foreground">
                    mewsss
                </h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                    your feeds, my way
                </p>
            </div>
        </SidebarTitle>
    )
}