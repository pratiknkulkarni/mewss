import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination.tsx";
import type {PaginationControlsProps} from "@/types/props.ts";

export function PaginationControls({handlePageChange, currentPage, pagination}: PaginationControlsProps) {
    return (
        <div className="flex items-center justify-around">
            <Pagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious disabled={pagination?.page === 1}
                                            onClick={() => handlePageChange(currentPage - 1)} size={"sm"}/>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                            disabled={!pagination?.hasMore}
                            onClick={() => handlePageChange(currentPage + 1)} size={"sm"}/>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
