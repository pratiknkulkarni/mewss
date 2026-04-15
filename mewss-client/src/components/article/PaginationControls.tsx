import {Field, FieldLabel} from "../ui/field";
import {Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious} from "../ui/pagination.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "../ui/select.tsx";

export function PaginationControls({handlePageChange, currentPage}: {
    handlePageChange: (newPage: number) => void,
    currentPage: number
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <Field orientation="horizontal" className="w-fit">
                <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
                <Select defaultValue="25">
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
                </Select>
            </Field>
            <Pagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} size={1}/>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)} size={1}/>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
