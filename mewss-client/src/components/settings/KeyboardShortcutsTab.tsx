import {TabShell} from "@/components/settings/TabShell.tsx";
import {ShortcutSection} from "@/components/settings/ShortcutSection.tsx";

export function KeyboardShortcutsTab() {
    return (
        <TabShell
            title="Keyboard Shortcuts"
            description="Reference for available keyboard shortcuts. Press ? anywhere in the app to see this as an overlay."
        >
            <div className="space-y-5">
                <ShortcutSection
                    title="Global"
                    shortcuts={[
                        {keys: ["?"], description: "Toggle keyboard shortcut overlay"},
                        {keys: ["A"], description: "Load All Articles"},
                        {keys: ["S"], description: "Load Starred Articles"},
                        {keys: ["i"], description: "Open Add Feed modal"},
                        {keys: ["u"], description: "Toggle Unread / All filter"},
                        {keys: ["Shift", "R"], description: "Refresh current feeds"},
                        {keys: ["Shift", "M"], description: "Mark all as read"},
                    ]}
                />
                <ShortcutSection
                    title="Pane Navigation"
                    shortcuts={[
                        {keys: ["h"], description: "Move focus to Sidebar"},
                        {keys: ["l"], description: "Move focus to Article List"},
                        {keys: ["j"], description: "Move selection down"},
                        {keys: ["k"], description: "Move selection up"},
                        {keys: ["g", "g"], description: "Jump to first item"},
                        {keys: ["G"], description: "Jump to last item"},
                    ]}
                />
                <ShortcutSection
                    title="Sidebar (when sidebar is focused)"
                    shortcuts={[
                        {keys: ["Enter"], description: "Load selected feed and switch focus to articles"},
                    ]}
                />
                <ShortcutSection
                    title="Article List (when article list is focused)"
                    shortcuts={[
                        {keys: ["Enter"], description: "Open selected article in new tab"},
                        {keys: ["o"], description: "Open selected article in new tab"},
                        {keys: ["m"], description: "Toggle Read / Unread"},
                        {keys: ["s"], description: "Toggle Star"},
                        {keys: ["]"], description: "Next page"},
                        {keys: ["["], description: "Previous page"},
                    ]}
                />
            </div>
        </TabShell>
    );
}
