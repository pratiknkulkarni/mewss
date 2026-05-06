import {useEffect} from "react";

function KeyBadge({children}: { children: React.ReactNode }) {
    return (
        <kbd className="
            inline-flex items-center justify-center
            min-w-[1.75rem] h-7 px-1.5
            rounded-md border border-border
            bg-muted text-muted-foreground
            font-mono text-[11px] font-medium
            shadow-[0_1px_0_0_hsl(var(--border))]
            leading-none
        ">
            {children}
        </kbd>
    );
}

function ShortcutRow({keys, description}: { keys: string[]; description: string }) {
    return (
        <div className="flex items-center gap-3 py-1.5">
            <div className="flex items-center gap-1 shrink-0 min-w-[6rem]">
                {keys.map((k, i) => (
                    <KeyBadge key={i}>{k}</KeyBadge>
                ))}
            </div>
            <span className="text-sm text-muted-foreground leading-snug">{description}</span>
        </div>
    );
}

function Section({title, children}: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="
                text-[10px] uppercase tracking-[0.18em] font-semibold
                text-muted-foreground/50 mb-2 pb-1.5
                border-b border-border
            ">
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">{children}</div>
        </div>
    );
}


interface KeyboardHelpOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function KeyboardHelpOverlay({isOpen, onClose}: KeyboardHelpOverlayProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener("keydown", handler, {capture: true});
        return () => window.removeEventListener("keydown", handler, {capture: true});
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4
                       bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="
                    relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
                    rounded-2xl border border-border bg-card shadow-2xl
                    p-6 sm:p-8 space-y-6
                "
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-2">
                    <h2 className="font-heading text-2xl font-semibold text-foreground">
                        Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Press{" "}
                        <KeyBadge>?</KeyBadge>
                        {" "}or{" "}
                        <KeyBadge>Esc</KeyBadge>
                        {" "}to dismiss
                    </p>
                </div>

                <Section title="Global">
                    <ShortcutRow keys={["?"]} description="Toggle this help overlay"/>
                    <ShortcutRow keys={["A"]} description="Load All Articles"/>
                    <ShortcutRow keys={["i"]} description="Open Add Feed modal"/>
                    <ShortcutRow keys={["S"]} description="Load Starred Articles"/>
                    <ShortcutRow keys={["u"]} description="Toggle Unread / All filter"/>
                    <ShortcutRow keys={["Shift", "R"]} description="Refresh feeds"/>
                    <ShortcutRow keys={["Shift", "M"]} description="Mark all as read"/>
                </Section>

                <Section title="Pane Navigation">
                    <ShortcutRow keys={["h"]} description="Focus Sidebar"/>
                    <ShortcutRow keys={["l"]} description="Focus Article List"/>
                    <ShortcutRow keys={["j"]} description="Move selection down"/>
                    <ShortcutRow keys={["k"]} description="Move selection up"/>
                    <ShortcutRow keys={["g", "g"]} description="Jump to first item"/>
                    <ShortcutRow keys={["G"]} description="Jump to last item"/>
                </Section>

                <Section title="Sidebar (when sidebar is focused)">
                    <ShortcutRow keys={["Enter"]} description="Load selected feed and switch to articles"/>
                </Section>

                <Section title="Articles (when article list is focused)">
                    <ShortcutRow keys={["Enter"]} description="Open article in new tab"/>
                    <ShortcutRow keys={["o"]} description="Open article in new tab"/>
                    <ShortcutRow keys={["m"]} description="Toggle Read / Unread"/>
                    <ShortcutRow keys={["s"]} description="Toggle Star"/>
                    <ShortcutRow keys={["]"]} description="Next page"/>
                    <ShortcutRow keys={["["]} description="Previous page"/>
                </Section>
            </div>
        </div>
    );
}
