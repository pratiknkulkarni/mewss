import type {ArticleCardProps} from "../../types/props.ts";

export default function ArticleCard({article, isActive, onClick}: ArticleCardProps) {
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
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0"/>
                )}
                <div className={`flex-1 ${article.isRead && !isActive ? 'pl-5' : ''}`}>
                    <div className="flex justify-between items-baseline mb-1">
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wider">
              {article.url}
            </span>
                        <span className="font-mono text-[10px] text-muted-foreground/40">
              {article.publishedAt}
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
