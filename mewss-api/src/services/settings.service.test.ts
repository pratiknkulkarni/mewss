import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../repositories/settings.repository.js", () => ({
    getSettingsByUser: vi.fn(),
    upsertSettings: vi.fn(),
    DEFAULT_SETTINGS: {
        theme: "system",
        itemsPerPage: 25,
        articleRetentionHours: null,
        defaultFeedView: "all",
        markReadOnOpen: true,
    },
}));

import * as settingsRepo from "../repositories/settings.repository.js";
import {getSettings, updateSettings} from "./settings.service.js";

const USER_ID = "user-abc";

function makeSettingsRow(overrides: Record<string, unknown> = {}) {
    return {
        userId: USER_ID,
        theme: "system",
        itemsPerPage: 25,
        articleRetentionHours: null,
        defaultFeedView: "all",
        markReadOnOpen: true,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getSettings", () => {
    it("returns the existing row when settings exist", async () => {
        const row = makeSettingsRow({theme: "dark"});
        vi.mocked(settingsRepo.getSettingsByUser).mockResolvedValueOnce(row as any);

        const result = await getSettings(USER_ID);

        expect(settingsRepo.getSettingsByUser).toHaveBeenCalledWith(USER_ID);
        expect(result.theme).toBe("dark");
    });

    it("returns defaults merged with userId when no row found", async () => {
        vi.mocked(settingsRepo.getSettingsByUser).mockResolvedValueOnce(null);

        const result = await getSettings(USER_ID);

        expect(result.userId).toBe(USER_ID);
        expect(result.theme).toBe("system");
        expect(result.itemsPerPage).toBe(25);
        expect(result.articleRetentionHours).toBeNull();
    });
});

describe("updateSettings", () => {
    it("calls upsertSettings with the userId and provided updates", async () => {
        const updated = makeSettingsRow({theme: "dark"});
        vi.mocked(settingsRepo.upsertSettings).mockResolvedValueOnce(updated as any);

        const result = await updateSettings(USER_ID, {theme: "dark"});

        expect(settingsRepo.upsertSettings).toHaveBeenCalledWith(USER_ID, {theme: "dark"});
        expect(result.theme).toBe("dark");
    });

    it("accepts null for articleRetentionHours (never expire)", async () => {
        const updated = makeSettingsRow({articleRetentionHours: null});
        vi.mocked(settingsRepo.upsertSettings).mockResolvedValueOnce(updated as any);

        const result = await updateSettings(USER_ID, {articleRetentionHours: null});

        expect(result.articleRetentionHours).toBeNull();
    });

    it("accepts valid retention hours: 720, 1440, 2160", async () => {
        for (const hours of [720, 1440, 2160] as const) {
            const updated = makeSettingsRow({articleRetentionHours: hours});
            vi.mocked(settingsRepo.upsertSettings).mockResolvedValueOnce(updated as any);

            const result = await updateSettings(USER_ID, {articleRetentionHours: hours});

            expect(result.articleRetentionHours).toBe(hours);
            vi.clearAllMocks();
        }
    });

    it("accepts valid itemsPerPage values: 10, 25, 50, 100", async () => {
        for (const n of [10, 25, 50, 100] as const) {
            const updated = makeSettingsRow({itemsPerPage: n});
            vi.mocked(settingsRepo.upsertSettings).mockResolvedValueOnce(updated as any);

            const result = await updateSettings(USER_ID, {itemsPerPage: n});

            expect(result.itemsPerPage).toBe(n);
            vi.clearAllMocks();
        }
    });

    it("can update multiple fields at once", async () => {
        const updated = makeSettingsRow({theme: "light", itemsPerPage: 10});
        vi.mocked(settingsRepo.upsertSettings).mockResolvedValueOnce(updated as any);

        const result = await updateSettings(USER_ID, {theme: "light", itemsPerPage: 10});

        expect(settingsRepo.upsertSettings).toHaveBeenCalledWith(USER_ID, {
            theme: "light",
            itemsPerPage: 10,
        });
        expect(result.theme).toBe("light");
        expect(result.itemsPerPage).toBe(10);
    });
});
