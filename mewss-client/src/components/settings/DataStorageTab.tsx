import {useState} from "react";
import {FileUp, FileDown, Database} from "lucide-react";
import {TabShell} from "./TabShell";

export function DataStorageTab() {
    const [retentionPeriod, setRetentionPeriod] = useState("90");

    const retentionOptions = [
        {value: "30", label: "30 days"},
        {value: "60", label: "60 days"},
        {value: "90", label: "90 days", isDefault: true},
        {value: "never", label: "Never"},
    ];

    return (
        <TabShell
            title="Data & Storage"
            description="Export subscriptions, import sources, and configure retention policies."
        >
            <div className="w-full max-w-3xl space-y-12 relative">

                <section className="space-y-4">
                    <h2 className="text-xs font-mono font-medium tracking-[0.2em] text-primary uppercase">
                        Feed Management
                    </h2>

                    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-foreground">OPML Import/Export</h3>
                            <p className="text-sm text-muted-foreground">
                                Transfer your RSS subscriptions to or from other feed readers using standard OPML files.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                className="cursor-pointer flex items-center justify-center gap-2 text-sm px-4 py-2 rounded border border-border text-primary hover:border-primary hover:bg-primary/10 transition-colors w-full sm:w-auto">
                                <FileUp className="w-4 h-4"/>
                                Import OPML
                            </button>
                            <button
                                className="cursor-pointer flex items-center justify-center gap-2 text-sm px-4 py-2 rounded border border-border text-primary hover:border-primary hover:bg-primary/10 transition-colors w-full sm:w-auto">
                                <FileDown className="w-4 h-4"/>
                                Export OPML
                            </button>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xs font-mono font-medium tracking-[0.2em] text-primary uppercase">
                        Archives
                    </h2>

                    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-foreground">Data Dump</h3>
                            <p className="text-sm text-muted-foreground">
                                Includes full article content and metadata in a portable JSON format. Only for "Starred"
                                articles.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                className="cursor-pointer flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity w-full sm:w-auto">
                                <Database className="w-4 h-4"/>
                                Download JSON Archive
                            </button>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xs font-mono font-medium tracking-[0.2em] text-primary uppercase">
                        Retention
                    </h2>

                    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-foreground">Retention Policy</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage how long unread articles are kept before being automatically cleared to save
                                space.
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="text-sm font-medium text-foreground">Auto-delete unread articles after:
                            </div>
                            <div className="space-y-3">
                                {retentionOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setRetentionPeriod(option.value)}
                                        className="flex items-center gap-3 w-full text-left group"
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors
                    ${retentionPeriod === option.value
                                            ? 'border-primary'
                                            : 'border-muted-foreground group-hover:border-foreground'}`}
                                        >
                                            {retentionPeriod === option.value && (
                                                <div className="w-2 h-2 rounded-full bg-primary"/>
                                            )}
                                        </div>

                                        <div className="text-sm text-foreground flex items-center gap-2">
                                            {option.label}
                                            {option.isDefault && (
                                                <span
                                                    className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                        (Default)
                      </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </TabShell>
    );
}