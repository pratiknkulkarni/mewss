import {useContext} from "react";
import {ConfirmDialogContext, type ConfirmFn} from "@/components/ui/confirm-dialog-context.tsx";

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmDialogContext)
    if (!ctx) throw new Error("useConfirm must be used inside <ConfirmDialogProvider>")
    return ctx
}
