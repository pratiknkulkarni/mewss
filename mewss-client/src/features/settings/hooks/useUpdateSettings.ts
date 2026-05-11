import {useMutation, useQueryClient} from "@tanstack/react-query";
import {settingsKeys} from "@/lib/query-keys.ts";
import {settingsApi, type UpdateSettingsInput} from "@/lib/settings-api.ts";

export function useUpdateSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateSettingsInput) => settingsApi.update(input),
        onSuccess: (data) => {
            queryClient.setQueryData(settingsKeys.detail(), data);
        },
    });
}
