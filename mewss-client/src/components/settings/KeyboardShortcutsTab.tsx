import {TabShell} from "@/components/settings/TabShell.tsx";

export function KeyboardShortcutsTab() {
    return (
        <TabShell
            title="Keyboard Shortcuts"
            description="Reference for available keyboard shortcuts. These cannot be modified."
        >
            <div className="h-64 rounded-xl border border-border bg-card/50 border-dashed"/>
        </TabShell>
    );
}
