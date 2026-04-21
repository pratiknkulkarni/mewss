import type { FeedModalProps } from "@/types/props";
import { Dialog, DialogContent } from "../ui/dialog";
import { FeedModalHeader } from "./feed-modal-header";
import { FeedModalForm, secondsToIntervalString } from "./feed-modal-form";
import { useCreateFeed } from "@/features/feeds/hooks/useCreateFeed";
import React, { useState } from "react";
import { ApiError } from "@/lib/api-error";

// FeedModal is intentionally generic (not Add/UpdateFeedModal) so it can be
// reused for editing an existing feed later — just pass in initial values.
export function FeedModal({ isOpen, onClose }: FeedModalProps) {
    const { mutate, isPending } = useCreateFeed();

    const [url, setUrl] = useState<string>("")
    const [refreshInterval, setRefreshInterval] = useState<string>("86400")
    const [formError, setFormError] = useState<string | null>(null)

    const resetForm = () => {
        setUrl("")
        setRefreshInterval("86400")
        setFormError(null)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSubmit = (event: React.SyntheticEvent) => {
        event.preventDefault()
        setFormError(null)

        // const intervalString = secondsToIntervalString(parseInt(refreshInterval, 10))
        const intervalString = Number(refreshInterval);

        mutate(
            { url, refreshInterval: intervalString },
            {
                onSuccess: () => {
                    resetForm()
                    onClose()
                },
                onError: (error) => {
                    if (error instanceof ApiError) {
                        console.log(error.message)
                        setFormError(error?.message)
                    } else {
                        console.log("error from creating feed -> ")
                        console.log(error);
                        console.log("<- error from creating feed ")
                    }
                }
            }
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full rounded-xl p-0 gap-0 overflow-hidden">
                <FeedModalHeader />
                <FeedModalForm
                    handleSubmit={handleSubmit}
                    handleClose={handleClose}
                    refreshInterval={refreshInterval}
                    setRefreshInterval={setRefreshInterval}
                    url={url}
                    setUrl={setUrl}
                    isSubmitting={isPending}
                    formError={formError}
                />
            </DialogContent>
        </Dialog>
    )
}