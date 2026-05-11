import { authClient } from "@/features/auth/api/auth-client";
import {useSettingsContext} from "@/contexts/SettingsContext.tsx";
import { NavUser } from "../ui/nav-user";

export function SidebarUser() {
    const { data } = authClient.useSession();

    const user: {
        name: string
        email: string
    } = {
        name: data?.user?.name || "",
        email: data?.user?.email || "",
    }

    const {settings} = useSettingsContext();

    return (
        <div className="flex-none relative z-10 bg-card">
            <NavUser user={user} defaultTheme={settings.theme} />
        </div>
    )
}