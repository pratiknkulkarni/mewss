import { useState } from "react"
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FieldError } from "../ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { FeedModalFormProps } from "@/types/props";
import { Button } from "../ui/button";

const DEFAULT_PRESETS: { seconds: number; label: string }[] = [
    { seconds: 3600, label: "1 hour" },
    { seconds: 7200, label: "2 hours" },
    { seconds: 10800, label: "3 hours" },
    { seconds: 14400, label: "4 hours" },
    { seconds: 21600, label: "6 hours" },
    { seconds: 43200, label: "12 hours" },
    { seconds: 86400, label: "24 hours" },
]

export function secondsToIntervalString(seconds: number): string {
    if (seconds % 3600 === 0) return `${seconds / 3600}h`
    return `${seconds / 60}m`
}

export function FeedModalForm({
    url,
    setUrl,
    refreshInterval,
    setRefreshInterval,
    handleSubmit,
    handleClose,
    isSubmitting = false,
    formError = null,
}: FeedModalFormProps) {
    const [errors, setErrors] = useState<{
        url: string | null
        interval: string | null
    }>({ url: null, interval: null })

    const selectedLabel =
        DEFAULT_PRESETS.find((p) => String(p.seconds) === refreshInterval)?.label
        ?? "Select interval"

    return (
        <form noValidate onSubmit={handleSubmit}>
            <div className="px-5 py-5 grid gap-5">

                {formError && (
                    <Alert variant="destructive" className="py-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            {formError}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-1.5">
                    <Label
                        htmlFor="feed-url"
                        className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground"
                    >
                        Feed URL
                    </Label>
                    <Input
                        id="feed-url"
                        placeholder="https://example.com/feed.xml"
                        type="url"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value)
                            if (errors.url) setErrors((p) => ({ ...p, url: null }))
                        }}
                        autoFocus
                        required
                        autoComplete="off"
                        className={errors.url ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.url && <FieldError>{errors.url}</FieldError>}
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Check Every
                    </Label>

                    <Select
                        value={refreshInterval}
                        onValueChange={(v) => {
                            if (v) {
                                setRefreshInterval(v)
                            }
                            if (errors.interval) setErrors((p) => ({ ...p, interval: null }))
                        }}
                    >
                        <SelectTrigger
                            className={errors.interval ? "border-destructive focus-visible:ring-destructive" : ""}
                        >
                            <SelectValue placeholder="Select interval">
                                {selectedLabel}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            <SelectGroup>
                                {DEFAULT_PRESETS.map(({ seconds, label }) => (
                                    <SelectItem key={seconds} value={String(seconds)}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {errors.interval && <FieldError>{errors.interval}</FieldError>}
                </div>

                <div className="flex gap-2 pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !url.trim()}
                        className="flex-1 sm:flex-none"
                    >
                        {isSubmitting ? "Adding…" : "Add Feed"}
                    </Button>
                </div>

            </div>
        </form>
    )
}