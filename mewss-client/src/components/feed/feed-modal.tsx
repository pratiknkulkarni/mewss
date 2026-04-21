import type { FeedModalProps } from "@/types/props";
import { Dialog, DialogContent } from "../ui/dialog";
import { FeedModalHeader } from "./feed-modal-header";
import { FeedModalFooter } from "./feed-modal-footer";
import { FeedModalForm } from "./feed-modal-form";

// I will likely be using this for adding and updating the feeds,
// which is why FeedModal and not (Add|Update)FeedModal separate
export function FeedModal({ isOpen, onClose }: FeedModalProps) {
    const handleClose = () => {
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose()
            }
        }}>
            <DialogContent>
                <FeedModalHeader />
                <FeedModalForm />
                <FeedModalFooter handleClose={handleClose} />
            </DialogContent>
        </Dialog >
    )
}