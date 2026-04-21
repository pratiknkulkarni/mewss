import { useState } from "react"
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FieldError } from "../ui/field";

export function FeedModalForm() {
    const [errors, setErrors] = useState<{ url: string | null, interval: string | null, form: string | null }>({ url: null, interval: null, form: null });
    const [url, setUrl] = useState<string>("");

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

            </div>
        </form>
    )
}