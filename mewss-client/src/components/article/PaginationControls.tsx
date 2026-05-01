import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination.tsx";
import type { PaginationControlsProps } from "@/types/props.ts";

export function PaginationControls({ handlePageChange, currentPage, pagination }: PaginationControlsProps) {
    return (
        <div className="flex items-center justify-around">
            {/* <Field orientation="horizontal" className="w-fit">
                <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel> */}
            {/* <Select defaultValue="25">
                    <SelectTrigger className="w-20" id="select-rows-per-page">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent align="start">
                        <SelectGroup>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select> */}
            {/* </Field> */}
            <Pagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious disabled={pagination?.page === 1}
                            onClick={() => handlePageChange(currentPage - 1)} size={"sm"} />
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                            disabled={!pagination?.hasMore}
                            onClick={() => handlePageChange(currentPage + 1)} size={"sm"} />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
