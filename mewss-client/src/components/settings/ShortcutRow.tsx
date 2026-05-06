import {KeyBadge} from "@/components/settings/KeyBadge.tsx";
import type {ShortcutRowProps} from "@/types/props.ts";

export function ShortcutRow({keys, description}: ShortcutRowProps) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-1 shrink-0 min-w-[7rem]">
                {keys.map((k: string, i: number) => (
                    <KeyBadge key={i}>{k}</KeyBadge>
                ))}
            </div>
            <span className="text-sm text-muted-foreground leading-snug">{description}</span>
        </div>
    );
}