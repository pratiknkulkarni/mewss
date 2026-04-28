import {createContext, useRef, useState} from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmOptions {
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmDialogContext = createContext<ConfirmFn | null>(null)

export function ConfirmDialogProvider({children}: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<ConfirmOptions | null>(null)

    const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

    const confirm: ConfirmFn = (opts) => {
        setOptions(opts)
        setOpen(true)

        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve
        })
    }

    function handleConfirm() {
        resolverRef.current?.(true)
        resolverRef.current = null
        setOpen(false)
    }

    function handleCancel() {
        resolverRef.current?.(false)
        resolverRef.current = null
        setOpen(false)
    }

    return (
        <ConfirmDialogContext.Provider value={confirm}>
            {children}

            <AlertDialog open={open} onOpenChange={(v) => {
                if (!v) handleCancel()
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                        <AlertDialogDescription>{options?.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {options?.cancelLabel ?? "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={options?.destructive
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : undefined
                            }
                        >
                            {options?.confirmLabel ?? "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmDialogContext.Provider>
    )
}
