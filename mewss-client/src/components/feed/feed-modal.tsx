import type { FeedModalProps } from "@/types/props";
import { FeedModalHeader } from "./feed-modal-header";
import { FeedModalForm } from "./feed-modal-form";
import { useCreateFeed } from "@/features/feeds/hooks/useCreateFeed";
import React, { useState } from "react";
import { ApiError } from "@/lib/api-error";
import { useUpdateFeed } from "@/features/feeds/hooks/useUpdateFeed.ts";
import type { UpdateFeedInput } from "@/types/api.ts";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";

function nsToSecondsStr(ns: number): string {
    return String(Math.round(ns / 1_000_000_000))
}


// FeedModal is intentionally generic (not Add/UpdateFeedModal) so it can be
// reused for editing an existing feed later — just pass in initial values.
export function FeedModal({ isOpen, onClose, feed, onFeedCreated }: FeedModalProps) {
    const isEditMode = Boolean(feed);

    const { mutate: updateMutate, isPending: isUpdating } = useUpdateFeed();
    const { mutate: createMutate, isPending: isCreating } = useCreateFeed();

    // since I am showing "Loading" irrespective of "creation" and "updation" (not a word), add a common state
    const isPending = isEditMode ? isUpdating : isCreating;

    const [url, setUrl] = useState<string>(feed?.url ?? "")
    const [refreshInterval, setRefreshInterval] = useState<string>(
        feed ? nsToSecondsStr(feed.refreshInterval) : "86400"
    )
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

        // mode is edit AND feed is present, else API will throw up
        if (isEditMode && feed) {
            const updates: UpdateFeedInput = {};
            const newIntervalSeconds = Number(refreshInterval);
            const currentIntervalSeconds = Math.round(feed.refreshInterval / 1000000000);

            if (newIntervalSeconds !== currentIntervalSeconds) {
                updates.refreshInterval = newIntervalSeconds
            }

            if (!updates.refreshInterval && !updates.status) {
                handleClose()
                return
            }

            updateMutate({
                id: feed?.id,
                input: updates
            }, {
                onSuccess: () => {
                    resetForm()
                    onClose()
                },
                onError: (error) => {
                    if (error instanceof ApiError) {
                        setFormError(error?.message)
                    }
                }
            })
        } else {
            const intervalString = Number(refreshInterval);
            createMutate(
                { url, refreshInterval: intervalString },
                {
                    onSuccess: (data) => {
                        resetForm()
                        onClose()
                        onFeedCreated?.(data.feed.id);
                    },
                    onError: (error) => {
                        if (error instanceof ApiError) {
                            setFormError(error?.message)
                        }
                    }
                }
            )
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose()
        }}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full rounded-xl p-0 gap-0 overflow-hidden">
                <FeedModalHeader isEditMode={isEditMode} />
                <FeedModalForm
                    handleSubmit={handleSubmit}
                    handleClose={handleClose}
                    refreshInterval={refreshInterval}
                    setRefreshInterval={setRefreshInterval}
                    url={url}
                    setUrl={setUrl}
                    isSubmitting={isPending}
                    formError={formError}
                    isEditMode={isEditMode}
                />
            </DialogContent>
        </Dialog>
    )
}