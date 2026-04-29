import {useState} from "react"
import {AlertCircle, Clock} from "lucide-react";
import type {FeedModalFormProps} from "@/types/props";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {FieldError} from "@/components/ui/field.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";

const DEFAULT_PRESETS: { seconds: number; label: string }[] = [
    {seconds: 3600, label: "1 hour"},
    {seconds: 7200, label: "2 hours"},
    {seconds: 10800, label: "3 hours"},
    {seconds: 14400, label: "4 hours"},
    {seconds: 21600, label: "6 hours"},
    {seconds: 43200, label: "12 hours"},
    {seconds: 86400, label: "24 hours"},
]

export function FeedModalForm({
                                  url,
                                  setUrl,
                                  refreshInterval,
                                  setRefreshInterval,
                                  handleSubmit,
                                  handleClose,
                                  isEditMode,
                                  isSubmitting = false,
                                  formError = null,
                              }: FeedModalFormProps) {
    const [errors, setErrors] = useState<{
        url: string | null
        interval: string | null
    }>({url: null, interval: null})

    const selectedLabel =
        DEFAULT_PRESETS.find((p) => String(p.seconds) === refreshInterval)?.label
        ?? "Select interval"

    return (
        <form noValidate onSubmit={handleSubmit}>
            <div className="px-5 py-5 grid gap-5">

                {formError && (
                    <Alert variant="destructive" className="py-3">
                        <AlertCircle className="h-4 w-4"/>
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
                            if (errors.url) setErrors((p) => ({...p, url: null}))
                        }}
                        autoFocus={!isEditMode}
                        required={!isEditMode}
                        autoComplete="off"
                        disabled={isEditMode} // TODO: I am disabling this in edit mode, however, should I?
                        className={`
                            ${errors.url ? "border-destructive focus-visible:ring-destructive" : ""}
                            ${isEditMode ? "opacity-60 cursor-not-allowed bg-muted/40" : ""}
                        `}
                    />
                    {/*TODO: this one as well, should I?*/}
                    {isEditMode && (
                        <p className="text-[11px] text-muted-foreground/60">
                            Feed URL cannot be changed. Delete and re-add the feed to use a different URL.
                        </p>
                    )}
                    {errors.url && <FieldError>{errors.url}</FieldError>}
                </div>

                <div className="grid gap-1.5">
                    <Label
                        className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3"/>
                        Check Every
                    </Label>

                    <Select
                        value={refreshInterval}
                        onValueChange={(v) => {
                            if (v) {
                                setRefreshInterval(v)
                            }
                            if (errors.interval) setErrors((p) => ({...p, interval: null}))
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
                                {DEFAULT_PRESETS.map(({seconds, label}) => (
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
                        {isSubmitting
                            ? (isEditMode ? "Saving…" : "Adding…")
                            : (isEditMode ? "Save Changes" : "Add Feed")
                        }
                    </Button>
                </div>

            </div>
        </form>
    )
}