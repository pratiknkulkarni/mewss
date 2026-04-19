import type { ArticleCardProps } from "@/types/props";
import { formatDistanceToNowStrict, differenceInDays, format } from 'date-fns';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  if (differenceInDays(Date.now(), date) < 7) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }

  return format(date, "MMM d");
}

export default function ArticleCard({ article, isActive, onClick }: ArticleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative px-5 py-6 border-b border-border transition-colors cursor-pointer
        ${isActive ? 'bg-primary/[0.07] border-l-2 border-l-primary' : 'hover:bg-muted/50'}
        ${article.isRead && !isActive ? 'opacity-60' : 'opacity-100'}
      `}
    >
      <div className="flex items-start gap-3">
        {!article.isRead && (
          <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
        )}
        <div className={`flex-1 ${article.isRead && !isActive ? 'pl-5' : ''}`}>
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wider">
              {/*TODO: this works, partially. 
                                If one TLD gives multiple RSS feeds (ex - https://www.thehindu.com/rssfeeds/), all come up as "thehindu".
                                Keeping this for now.
                                */}
              {new URL(article.url).hostname.replace(/^www\./, "")}
              {/* {article.url} */}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/40">
              {/* {article.publishedAt} */}
              {relativeTime(article.publishedAt)}
            </span>
          </div>
          <h3
            className={`
              text-sm leading-tight mb-2 transition-colors
              ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}
              ${!article.isRead ? 'font-medium' : 'font-normal'}
            `}
          >
            {article.title}
          </h3>
          {isActive && article.summary && (
            <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
              {article.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
