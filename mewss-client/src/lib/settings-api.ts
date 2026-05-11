import {apiClient} from "./api-client.ts";
import type {SettingsResponse, Settings} from "@/types/api.ts";

export type UpdateSettingsInput = Partial<
    Pick<
        Settings,
        | "theme"
        | "itemsPerPage"
        | "articleRetentionHours"
    >
>;

export const settingsApi = {
    get(): Promise<SettingsResponse> {
        return apiClient.get<SettingsResponse>("/api/settings");
    },
    update(input: UpdateSettingsInput): Promise<SettingsResponse> {
        return apiClient.patch<SettingsResponse>("/api/settings", input);
    },
};
