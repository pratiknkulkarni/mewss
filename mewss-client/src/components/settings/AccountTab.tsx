import {TabShell} from "@/components/settings/TabShell.tsx";

export function AccountTab() {
    return (
        <TabShell
            title="Account"
            description="Manage your password, terminate active sessions, or permanently delete your account."
        >
            <div className="h-64 rounded-xl border border-border bg-card/50 border-dashed"/>
        </TabShell>
    );
}
