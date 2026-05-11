import {createContext, useContext, type ReactNode} from "react";
import {useSettings, DEFAULT_SETTINGS} from "@/features/settings/hooks/useSettings.ts";
import type {Settings} from "@/types/api.ts";

interface SettingsContextValue {
    settings: Settings;
    isLoading: boolean;
}

// Provide sensible defaults so consumers don't need to guard against undefined.
const SettingsContext = createContext<SettingsContextValue>({
    settings: {userId: "", ...DEFAULT_SETTINGS},
    isLoading: true,
});

/**
 * Fetches user settings once and makes them available app-wide.
 * Mount this inside the authenticated layout (inside _app/route.tsx) so it
 * only fires when a session is guaranteed to exist.
 */
export function SettingsProvider({children}: { children: ReactNode }) {
    const {data: settings, isLoading} = useSettings();

    return (
        <SettingsContext.Provider
            value={{
                settings: settings ?? {userId: "", ...DEFAULT_SETTINGS},
                isLoading,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

/**
 * Consume app-wide user settings. Guaranteed to return a non-null value;
 * falls back to defaults while loading.
 *
 * @example
 * const { settings } = useSettingsContext();
 * const limit = settings.itemsPerPage;
 */
export function useSettingsContext() {
    return useContext(SettingsContext);
}
