import {createFileRoute} from '@tanstack/react-router'
import SettingsPage from "@/components/settings/settings-page.tsx";

export const Route = createFileRoute('/_app/settings/')({
    component: SettingsComponent,
})

function SettingsComponent() {
    return (
        <SettingsPage/>
    )
}
