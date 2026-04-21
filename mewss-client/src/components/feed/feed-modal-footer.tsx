import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";

export function FeedModalFooter({ handleClose }: { handleClose: () => void }) {
    // TODO: handle loading states
    return (
        <DialogFooter className="px-5 py-4 border-t border-border flex flex-row gap-2 sm:gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled
                className="flex-1 sm:flex-none"
            >
                Cancel
            </Button>
            {/* TODO: add a loading state here mentioning "Adding...." | "Add Feed" */}
            <Button
                type="submit"
                disabled
                className="flex-1 sm:flex-none"
            >
                Add Feed
            </Button>
        </DialogFooter>
    )
}