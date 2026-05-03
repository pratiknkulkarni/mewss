import {TabShell} from "@/components/settings/TabShell.tsx";

export function DataStorageTab() {
    return (
        <TabShell
            title="Data & Storage"
            description="Export subscriptions, import sources, and configure retention policies."
        >
            <div className="h-64 rounded-xl border border-border bg-card/50 border-dashed"/>
        </TabShell>
    );
}