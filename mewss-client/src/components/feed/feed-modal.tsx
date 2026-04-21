import type { FeedModalProps } from "@/types/props";
import { Dialog, DialogContent } from "../ui/dialog";

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
                <h1>does this work?</h1>
                <h1>apparently?</h1>
            </DialogContent>
        </Dialog >
    )
}