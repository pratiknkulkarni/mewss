import {useState} from "react";
import {cn} from "@/lib/utils";
import {User, Database, Keyboard, LifeBuoy} from "lucide-react";
import {AccountTab} from "@/components/settings/AccountTab.tsx";
import {DataStorageTab} from "@/components/settings/DataStorageTab.tsx";
import {KeyboardShortcutsTab} from "@/components/settings/KeyboardShortcutsTab.tsx";

const TABS = [
    {id: "account", label: "Account", icon: User},
    {id: "data", label: "Data & Storage", icon: Database},
    {id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard},
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("account");

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground">
            <aside
                className="flex flex-col w-full md:w-64 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-sidebar p-4 md:p-6 md:min-h-screen">
                <div className="mb-4 md:mb-8 md:px-3">
                    <h2 className="font-heading text-2xl md:text-xl font-semibold text-sidebar-foreground">
                        Settings
                    </h2>
                </div>

                <nav
                    className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {TABS.map(({id, label, icon: Icon}) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 w-full rounded-md transition-colors text-left whitespace-nowrap md:whitespace-normal",
                                activeTab === id
                                    ? "bg-sidebar-accent"
                                    : "hover:bg-sidebar-accent/50"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    activeTab === id
                                        ? "text-sidebar-primary"
                                        : "text-foreground/60 opacity-80 group-hover:text-foreground group-hover:opacity-100"
                                )}
                            />
                            <span
                                className={cn(
                                    "font-sans text-[11px] uppercase tracking-widest font-medium transition-colors",
                                    activeTab === id
                                        ? "text-foreground"
                                        : "text-foreground/70 group-hover:text-foreground"
                                )}
                            >
                                {label}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="hidden md:block mt-auto border-t border-sidebar-border pt-4">
                    <button
                        className="group flex items-center gap-3 px-3 py-2.5 w-full rounded-md hover:bg-sidebar-accent/50 transition-colors text-left">
                        <LifeBuoy
                            className="h-4 w-4 shrink-0 text-foreground/60 opacity-80 group-hover:text-foreground group-hover:opacity-100 transition-colors"/>
                        <span
                            className="font-sans text-[11px] uppercase tracking-widest font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                            Help
                        </span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 py-8 md:px-12 md:py-16">
                    {activeTab === "account" && <AccountTab/>}
                    {activeTab === "data" && <DataStorageTab/>}
                    {activeTab === "shortcuts" && <KeyboardShortcutsTab/>}
                </div>
            </main>
        </div>
    );
}
