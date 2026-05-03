export function TabShell({
                             title,
                             description,
                             children,
                         }: {
    title: string;
    description: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="font-heading text-3xl font-semibold text-foreground mb-2">
                {title}
            </h3>
            <p className="text-base text-muted-foreground mb-10">{description}</p>
            {children}
        </div>
    );
}