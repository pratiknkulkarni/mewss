import {ExternalLink} from "lucide-react"
import {ScrollArea} from "../ui/scroll-area.tsx";
import type {ReadingPaneProps} from "../../types/props.ts";

function formatReadableDate(dateStr: string | null): string {
    if (!dateStr) return ""
    try {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateStr))
    } catch {
        return dateStr
    }
}

function EmptyReadingPane() {
    return (
        <div className="flex flex-1 h-full items-center justify-center">
            <p className="text-sm text-muted-foreground/50 select-none">
                Select an article to read
            </p>
        </div>
    )
}

export function ReadingPane({article}: ReadingPaneProps) {
    if (!article) {
        return <EmptyReadingPane/>
    }

    const publishedAt = formatReadableDate(article.publishedAt)
    const body = article.content ?? article.summary
    console.log(body);

    return (
        <ScrollArea className="flex-1 h-full">
            <article className="max-w-2xl mx-auto px-8 py-10">
                <header className="mb-8 space-y-3">
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary/70 hover:text-primary transition-colors"
                    >
                        {new URL(article.url).hostname.replace(/^www\./, "")}
                        <ExternalLink className="size-3"/>
                    </a>
                    <h1 className="text-2xl font-semibold leading-snug text-foreground">
                        {article.title}
                    </h1>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {article.author && (
                            <>
                                <span>{article.author}</span>
                                {publishedAt && <span className="text-muted-foreground/40">·</span>}
                            </>
                        )}
                        {publishedAt && <span>{publishedAt}</span>}
                    </div>
                </header>

                {body ? (
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                        // TODO: sanitize with DOMPurify or some library before finzliazing
                        dangerouslySetInnerHTML={{__html: body}}
                    />
                ) : (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        <p>No content available for this article.</p>
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                        >
                            Read on original site <ExternalLink className="size-3"/>
                        </a>
                    </div>
                )}
            </article>
        </ScrollArea>
    )
}
