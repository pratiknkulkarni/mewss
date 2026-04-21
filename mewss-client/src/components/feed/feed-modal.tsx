import type { FeedModalProps } from "@/types/props";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Rss } from "lucide-react";

// I will likely be using this for adding and updating the feeds,
// which is why FeedModal and not (Add|Update)FeedModal separate
export function FeedModal({ isOpen, onClose }: FeedModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose()
            }
        }}>
            <DialogContent>
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                            <Rss className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="font-heading text-base leading-tight text-foreground">
                                Add New Feed
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Paste an RSS or Atom feed URL to subscribe.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

            </DialogContent>
        </Dialog >
    )
}