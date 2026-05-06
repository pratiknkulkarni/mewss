export function KeyBadge({children}: { children: React.ReactNode }) {
    // this kind of looks like a key? I might switch to icons if I can find them
    // this messes up on the iPad view if the sidebar is open
    // TODO: check for som alternative to this one.
    return (
        <kbd className="
            inline-flex items-center justify-center
            min-w-[1.75rem] h-7 px-2
            rounded-md border border-border
            bg-muted text-foreground
            font-mono text-[11px] font-medium
            shadow-[0_2px_0_0_hsl(var(--border))]
            leading-none select-none
        ">
            {children}
        </kbd>
    );
}
