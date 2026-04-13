import { createFileRoute } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../../../components/ui/sidebar'
import { AppSidebar } from '../../../components/ui/app-sidebar'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { useState } from 'react'

export const Route = createFileRoute('/_app/home/')({
  component: HomeComponent,
})

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    source: 'Financial Times',
    author: 'Jonathan Wheatley',
    date: 'March 24, 2024',
    timeAgo: '12M AGO',
    title: 'The Liquidity Trap: How Emerging Markets are Navigating Volatility in 2024',
    snippet: 'Central banks across Southeast Asia are braceing for a period of extended high rates as the dollar maintains its dominance...',
    content: [
      'Central banks across the developing world are facing their toughest test in a generation. As the US Federal Reserve maintains its restrictive stance, the ripple effects are being felt from Jakarta to Johannesburg. The "higher-for-longer" narrative has effectively shuttered access to international bond markets for many frontier economies, forcing a reliance on domestic capital that is often insufficient.',
      'In Brazil, the central bank has begun a cautious easing cycle, but inflationary pressures remain sticky. "We are walking a tightrope," says one senior official at the Banco Central do Brasil. "Move too fast, and the currency collapses; move too slow, and we stifle the post-pandemic recovery."',
      'Investors have grown increasingly discerning, punishing countries with widening fiscal deficits while rewarding those with strong institutional frameworks. This divergence is creating a two-tier emerging market landscape, where Mexico and Vietnam thrive as manufacturing hubs, while others struggle with debt sustainability.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1611974717482-480928d195d6?q=80&w=2070&auto=format&fit=crop',
    isRead: false,
    isStarred: false,
    feedColor: 'bg-red-900'
  },
  {
    id: '2',
    source: 'Quartz Observer',
    author: 'Elena Rossi',
    date: 'March 24, 2024',
    timeAgo: '2H AGO',
    title: 'The Lithium Paradox: Why Supply is Surging While Prices Plummet',
    snippet: 'The global transition to electric vehicles was supposed to trigger a lithium gold rush. Instead, producers are facing a glut.',
    content: [
      'The global transition to electric vehicles was supposed to trigger a lithium gold rush. Instead, producers are facing a glut that has sent prices tumbling by more than 80% from their peak.',
      'This paradox is driven by a massive wave of new supply coming online just as EV demand growth begins to moderate in key markets like China and Europe.',
      'For the "Obsidian Ledger," this represents a classic commodity cycle play. The current volatility is shaking out high-cost producers, potentially setting the stage for a more sustainable, if less frenetic, growth phase in the late 2020s.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    isRead: false,
    isStarred: true,
    feedColor: 'bg-blue-900'
  },
  {
    id: '3',
    source: 'Bloomberg Tech',
    author: 'Mark Gurman',
    date: 'March 23, 2024',
    timeAgo: '4H AGO',
    title: 'NVIDIA Unveils Blackwell Architecture for Next-Gen AI Compute',
    snippet: 'Jensen Huang took the stage to announce a chip that promises to be the engine of the new industrial revolution.',
    content: [
      'Jensen Huang took the stage to announce a chip that promises to be the engine of the new industrial revolution. The Blackwell B200 GPU is not just a chip; it is a system designed for the trillion-parameter scale of generative AI.',
      'With 208 billion transistors, Blackwell is a monster of engineering. It features a second-generation transformer engine and a new NVLink interconnect that allows up to 576 GPUs to talk to each other.',
      'The implications for the tech sector are profound. NVIDIA is no longer just selling hardware; it is selling the infrastructure of intelligence.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
    isRead: true,
    isStarred: false,
    feedColor: 'bg-emerald-700'
  },
  {
    id: '4',
    source: 'Hacker News',
    author: 'obsidian_dev',
    date: 'March 24, 2024',
    timeAgo: '5H AGO',
    title: 'Show HN: An Obsidian plugin for tracking real-time ledger entries',
    snippet: 'I built this to manage my personal finances directly within my knowledge base. It supports double-entry accounting.',
    content: [
      'I built this to manage my personal finances directly within my knowledge base. It supports double-entry accounting and real-time visualization of your net worth.',
      'The plugin uses a custom parser for markdown-based ledger files, allowing you to keep your data in plain text while getting the benefits of a professional accounting tool.',
      'Early feedback has been great. Users love the ability to link transactions to meeting notes and project documents.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?q=80&w=2000&auto=format&fit=crop',
    isRead: false,
    isStarred: false,
    feedColor: 'bg-orange-800'
  },
  {
    id: '5',
    source: 'The Verge',
    author: 'Nilay Patel',
    date: 'March 24, 2024',
    timeAgo: '8H AGO',
    title: "The Vision Pro's Second Act: Can Content Catch Up to Hardware?",
    snippet: 'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive.',
    content: [
      'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive. The Vision Pro is a marvel of spatial computing, yet most users still find themselves using it for traditional 2D tasks.',
      'The second act for this device will depend entirely on developers creating experiences that are only possible in 3D space.',
      'We are seeing glimpses of this in professional training and immersive storytelling, but the consumer breakthrough is still on the horizon.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=2070&auto=format&fit=crop',
    isRead: false,
    isStarred: false,
    feedColor: 'bg-zinc-700'
  },
  {
    id: '5',
    source: 'The Verge',
    author: 'Nilay Patel',
    date: 'March 24, 2024',
    timeAgo: '8H AGO',
    title: "The Vision Pro's Second Act: Can Content Catch Up to Hardware?",
    snippet: 'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive.',
    content: [
      'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive. The Vision Pro is a marvel of spatial computing, yet most users still find themselves using it for traditional 2D tasks.',
      'The second act for this device will depend entirely on developers creating experiences that are only possible in 3D space.',
      'We are seeing glimpses of this in professional training and immersive storytelling, but the consumer breakthrough is still on the horizon.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=2070&auto=format&fit=crop',
    isRead: false,
    isStarred: false,
    feedColor: 'bg-zinc-700'
  },

  {
    id: '5',
    source: 'The Verge',
    author: 'Nilay Patel',
    date: 'March 24, 2024',
    timeAgo: '8H AGO',
    title: "The Vision Pro's Second Act: Can Content Catch Up to Hardware?",
    snippet: 'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive.',
    content: [
      'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive. The Vision Pro is a marvel of spatial computing, yet most users still find themselves using it for traditional 2D tasks.',
      'The second act for this device will depend entirely on developers creating experiences that are only possible in 3D space.',
      'We are seeing glimpses of this in professional training and immersive storytelling, but the consumer breakthrough is still on the horizon.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=2070&auto=format&fit=crop',
    isRead: false,
    isStarred: false,
    feedColor: 'bg-zinc-700'
  },
  {
    id: '5',
    source: 'The Verge',
    author: 'Nilay Patel',
    date: 'March 24, 2024',
    timeAgo: '8H AGO',
    title: "The Vision Pro's Second Act: Can Content Catch Up to Hardware?",
    snippet: 'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive.',
    content: [
      'Apple has built the most impressive piece of hardware in a decade, but the "killer app" remains elusive. The Vision Pro is a marvel of spatial computing, yet most users still find themselves using it for traditional 2D tasks.',
      'The second act for this device will depend entirely on developers creating experiences that are only possible in 3D space.',
      'We are seeing glimpses of this in professional training and immersive storytelling, but the consumer breakthrough is still on the horizon.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=2070&auto=format&fit=crop',
    isRead: false,
    isStarred: false,
    feedColor: 'bg-zinc-700'
  }

];

function HomeComponent() {
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(MOCK_ARTICLES[0].id);

  const handleArticleSelect = (id: string) => {
    setSelectedArticleId(id);
    setArticles(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  return (
    <div className='overflow-y-scroll'>
      <SidebarProvider>
        <SidebarInset className="flex flex-row overflow-hidden"></SidebarInset>
        <div className="flex h-screen w-full overflow-hidden bg-card text-foreground font-sans">
          <AppSidebar />
          <div className="flex-none w-[380px] bg-card border-r border-border flex flex-col h-full overflow-hidden">
            <header className="relative flex-none h-14 border-b border-border flex items-center px-5 glass sticky top-0 z-10">
              <div className="flex items-center">
                <SidebarTrigger />
              </div>
              <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold">
                All Articles
              </h2>
            </header>

            <ScrollArea className="flex-1 min-h-0">
              {articles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isActive={selectedArticleId === article.id}
                  onClick={() => handleArticleSelect(article.id)}
                />
              ))}
            </ScrollArea>

          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

export interface Article {
  id: string
  feedId: string
  userId: string
  url: string
  title: string
  content: string | null
  author: string | null
  publishedAt: string | null
  isRead: boolean
  createdAt: string
  updatedAt: string
}

function ArticleCard({ article, isActive, onClick }: {
  article: Article;
  isActive: boolean;
  onClick: () => void;
  key?: React.Key;
}) {
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
          <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
        )}
        <div className={`flex-1 ${article.isRead && !isActive ? 'pl-5' : ''}`}>
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wider">{article.url}</span>
            <span className="font-mono text-[10px] text-muted-foreground/40">{article.publishedAt}</span>
          </div>
          <h3 className={`
            text-sm leading-tight mb-2 transition-colors
            ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}
            ${!article.isRead ? 'font-medium' : 'font-normal'}
          `}>
            {article.title}
          </h3>
          {isActive && (
            <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
              {article.snippet}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

