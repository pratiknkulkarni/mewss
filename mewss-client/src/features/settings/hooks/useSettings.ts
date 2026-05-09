import {useQuery} from "@tanstack/react-query";
import {settingsKeys} from "@/lib/query-keys.ts";
import type {Settings} from "@/types/api.ts";
import {settingsApi} from "@/lib/settings-api.ts";

export const DEFAULT_SETTINGS: Omit<Settings, "userId"> = {
    theme: "system",
    itemsPerPage: 25,
    articleRetentionHours: null,
};

export function useSettings() {
    return useQuery({
        queryKey: settingsKeys.detail(),
        queryFn: () => settingsApi.get(),
        select: (data): Settings => data.settings,
        staleTime: 1000 * 60 * 5,
    });
}