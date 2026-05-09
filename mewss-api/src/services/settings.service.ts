import * as settingsRepo from "../repositories/settings.repository.js";
import {DEFAULT_SETTINGS} from "../repositories/settings.repository.js";
import {z} from "zod";
import {createLogger} from "../lib/logger.js";

const log = createLogger("service.settings");

export const updateSettingsSchema = z
    .object({
        theme: z.enum(["dark", "light", "system"]).optional(),
        itemsPerPage: z
            .number()
            .int()
            .refine((v) => [10, 25, 50, 100].includes(v), {
                message: "itemsPerPage must be one of 10, 25, 50, 100",
            })
            .optional(),
        articleRetentionHours: z
            .union([z.null(), z.literal(720), z.literal(1440), z.literal(2160)])
            .optional(),
        defaultFeedView: z.enum(["all", "unread"]).optional(),
        markReadOnOpen: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one setting must be provided",
    });

export async function getSettings(userId: string) {
    log.info({userId}, "getting settings");
    const row = await settingsRepo.getSettingsByUser(userId);
    if (!row) {
        log.debug({userId}, "no settings row found, returning defaults");
        return {userId, ...DEFAULT_SETTINGS};
    }
    return row;
}

export async function updateSettings(
    userId: string,
    input: z.infer<typeof updateSettingsSchema>,
) {
    log.info({userId, input}, "updating settings");
    const updated = await settingsRepo.upsertSettings(userId, input);
    log.info({userId}, "settings updated");
    return updated;
}
