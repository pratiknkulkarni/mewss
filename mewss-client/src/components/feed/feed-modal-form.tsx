import { useState } from "react"
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FieldError } from "../ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "../ui/select";

export function FeedModalForm() {
    const [errors, setErrors] = useState<{ url: string | null, interval: string | null, form: string | null }>({ url: null, interval: null, form: null });
    const [url, setUrl] = useState<string>("");
    const [selection, setSelection] = useState<string>("86400")

    const DEFAULT_PRESETS = [900, 1800, 3600, 21600, 86400, 604800]; // seconds
    const formatInterval = (seconds: number): string => {
        if (seconds % 86400 === 0) {
            const d = seconds / 86400
            return `${d} day${d !== 1 ? "s" : ""}`
        }
        if (seconds % 3600 === 0) {
            const h = seconds / 3600
            return `${h} hour${h !== 1 ? "s" : ""}`
        }
        if (seconds % 60 === 0) {
            const m = seconds / 60
            return `${m} min${m !== 1 ? "s" : ""}`
        }
        return `${seconds}s`
    }

    return (
        <form noValidate>
            {errors.form && (
                <Alert variant="destructive" className="py-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                        {errors.form}
                    </AlertDescription>
                </Alert>
            )}


            <div className="px-5 py-5 grid gap-5">
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
                    className={
                        errors.url
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                    }
                />

                {errors.url && (
                    <FieldError>{errors.url}</FieldError>
                )}
                <div className="grid gap-1.5">
                    <Label className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Check Every
                    </Label>

                    <Select
                        value={selection}
                        onValueChange={(v) => {
                            if (v !== null) {
                                setSelection(v)
                            }
                            if (errors.interval) {
                                setErrors((p) => ({ ...p, interval: null }))
                            }
                        }}
                    >
                        <SelectTrigger
                            className={
                                errors.interval
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : ""
                            }
                        >
                            <SelectValue placeholder="Select interval">
                                {selection === "custom" ? "Custom…" : formatInterval(parseInt(selection, 10))}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            <SelectGroup>
                                {DEFAULT_PRESETS.map((s) => (
                                    <SelectItem key={s} value={String(s)}>
                                        {formatInterval(s)}
                                    </SelectItem>
                                ))}
                            </SelectGroup>

                            <SelectSeparator />
                        </SelectContent>
                    </Select>

                    {errors.interval && (
                        <FieldError>{errors.interval}</FieldError>
                    )}
                </div>
            </div>
        </form>
    )
}