import {PencilIcon, Rss} from "lucide-react";
import {DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import type {FeedModalHeaderProps} from "@/types/props.ts";

export function FeedModalHeader({isEditMode}: FeedModalHeaderProps) {
    return (
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                    {isEditMode
                        ? <PencilIcon className="w-4 h-4 text-primary"/>
                        : <Rss className="w-4 h-4 text-primary"/>
                    }
                </div>
                <div>
                    <DialogTitle className="font-heading text-base leading-tight text-foreground">
                        {isEditMode ? "Edit Feed" : "Add New Feed"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        {isEditMode
                            ? "Update the refresh interval."
                            : "Paste an RSS or Atom feed URL to subscribe."
                        }
                    </DialogDescription>
                </div>
            </div>
        </DialogHeader>
    )
}