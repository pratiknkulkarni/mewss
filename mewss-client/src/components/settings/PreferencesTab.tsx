import {useTheme} from "next-themes";
import {TabShell} from "@/components/settings/TabShell.tsx";
import type {Settings} from "@/types/api.ts";
import {toast} from "sonner";
import {useUpdateSettings} from "@/features/settings/hooks/useUpdateSettings.ts";
import {useSettingsContext} from "@/contexts/SettingsContext.tsx";

type Theme = Settings["theme"];
type ItemsPerPage = Settings["itemsPerPage"];
type RetentionHours = Settings["articleRetentionHours"];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
    {value: "system", label: "System"},
    {value: "light", label: "Light"},
    {value: "dark", label: "Dark"},
];

const ITEMS_PER_PAGE_OPTIONS: { value: ItemsPerPage; label: string }[] = [
    {value: 10, label: "10"},
    {value: 25, label: "25"},
    {value: 50, label: "50"},
    {value: 100, label: "100"},
];

const RETENTION_OPTIONS: { value: RetentionHours; label: string }[] = [
    {value: 720, label: "30 days"},
    {value: 1440, label: "60 days"},
    {value: 2160, label: "90 days"},
    {value: null, label: "Never"},
];

function SettingRow({label, description, children}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border last:border-0">
            <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}

function SelectInput<T extends string | number | null>({
                                                           value,
                                                           options,
                                                           onChange,
                                                       }: {
    value: T;
    options: { value: T; label: string }[];
    onChange: (v: T) => void;
}) {
    return (
        <select
            value={String(value)}
            onChange={(e) => {
                const raw = e.target.value;
                const match = options.find((o) => String(o.value) === raw);
                if (match !== undefined) onChange(match.value);
            }}
            className="cursor-pointer bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground min-w-[120px]"
        >
            {options.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

export function PreferencesTab() {
    const {settings} = useSettingsContext();
    const {mutate} = useUpdateSettings();
    const {setTheme} = useTheme();

    function save<K extends keyof Settings>(key: K, value: Settings[K]) {
        mutate(
            {[key]: value} as any,
            {
                onSuccess: () => toast.success("Preference saved"),
                onError: () => toast.error("Failed to save preference"),
            },
        );

        if (key === "theme") {
            setTheme(value as string);
        }
    }

    return (
        <TabShell
            title="Preferences"
            description="Personalise how mewss looks and behaves for you."
        >
            <div className="w-full max-w-3xl space-y-8">

                <section className="space-y-1">
                    <h2 className="text-xs font-mono font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
                        Appearance
                    </h2>
                    <div className="bg-card border border-border rounded-lg px-4 divide-y divide-border">
                        <SettingRow
                            label="Theme"
                            description="Choose your preferred colour scheme."
                        >
                            <SelectInput
                                value={settings.theme}
                                options={THEME_OPTIONS}
                                onChange={(v) => save("theme", v)}
                            />
                        </SettingRow>
                    </div>
                </section>

                <section className="space-y-1">
                    <h2 className="text-xs font-mono font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
                        Reading
                    </h2>
                    <div className="bg-card border border-border rounded-lg px-4 divide-y divide-border">
                        <SettingRow
                            label="Articles per page"
                            description="How many articles to show in each page of the list."
                        >
                            <SelectInput
                                value={settings.itemsPerPage}
                                options={ITEMS_PER_PAGE_OPTIONS}
                                onChange={(v) => save("itemsPerPage", v)}
                            />
                        </SettingRow>

                    </div>
                </section>

                <section className="space-y-1">
                    <h2 className="text-xs font-mono font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
                        Data
                    </h2>
                    <div className="bg-card border border-border rounded-lg px-4 divide-y divide-border">
                        <SettingRow
                            label="Article retention"
                            description="How long to keep read articles. Starred articles are never deleted."
                        >
                            <SelectInput
                                value={settings.articleRetentionHours}
                                options={RETENTION_OPTIONS}
                                onChange={(v) => save("articleRetentionHours", v)}
                            />
                        </SettingRow>
                    </div>
                </section>

            </div>
        </TabShell>
    );
}
