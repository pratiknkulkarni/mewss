"use client"

import {
    BadgeCheck,
    ChevronsUpDown,
    LogOut,
    Settings,
} from "lucide-react"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/features/auth/api/auth-client"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { ModeToggle } from "../theme-toggle"

export function NavUser({
    user,
}: {
    user: {
        name: string
        email: string
    }
}) {
    const { isMobile } = useSidebar();
    const navigate = useNavigate();
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger className="w-full focus-visible:outline-none">
                        <SidebarMenuButton
                            size="lg"
                            className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src="" alt={user.name} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-(--anchor-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "top"}
                        align="end"
                        sideOffset={4}
                    >
                        <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src="" alt={user.name} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </div>
                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer">
                                <BadgeCheck />
                                Account
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                            <Settings />
                            <ModeToggle />
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="cursor-pointer" onClick={() => {
                            authClient.signOut({
                                fetchOptions: {
                                    onSuccess: () => {
                                        navigate({
                                            to: "/login",
                                            replace: true
                                        })

                                        toast.success('Logout success!', {
                                            position: "bottom-right",
                                        })
                                    },
                                    onError: (err) => {
                                        toast.error(`${err.error.message}`, {
                                            position: "bottom-right",
                                        })
                                    }
                                }
                            })
                        }}
                        >
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
