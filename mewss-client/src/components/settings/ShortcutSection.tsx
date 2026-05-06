import type {ShortcutRowProps} from "@/types/props.ts";
import {ShortcutRow} from "@/components/settings/ShortcutRow.tsx";

export function ShortcutSection({title, shortcuts}: { title: string; shortcuts: ShortcutRowProps[] }) {
    const mid = Math.ceil(shortcuts.length / 2);
    const col1 = shortcuts.slice(0, mid);
    const col2 = shortcuts.slice(mid);

    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/60 border-b border-border">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/70">
                    {title}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="px-4 sm:border-r border-border">
                    {col1.map((s, i) => <ShortcutRow key={i} {...s} />)}
                </div>
                {col2.length > 0 && (
                    <div className="px-4">
                        {col2.map((s, i) => <ShortcutRow key={i} {...s} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
