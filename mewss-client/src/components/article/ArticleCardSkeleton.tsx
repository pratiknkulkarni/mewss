import {Skeleton} from "@/components/ui/skeleton.tsx";

export function ArticleCardSkeleton() {
    return (
        <div className="px-5 py-6 border-b border-border">
            <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2.5">
                    <Skeleton className="h-2 w-16"/>
                    <Skeleton className="h-3.5 w-full"/>
                    <Skeleton className="h-3.5 w-3/4"/>
                </div>
            </div>
        </div>
    );
}
