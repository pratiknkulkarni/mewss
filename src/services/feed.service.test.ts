import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../repositories/feed.repository.js", () => ({
    createFeed: vi.fn(),
    listFeedsByUser: vi.fn(),
    findFeedByIdAndUser: vi.fn(),
    deleteFeedByIdAndUser: vi.fn(),
    triggerFeedRefresh: vi.fn(),
}));

vi.mock("../lib/scheduler-client.js", () => ({
    validateFeedUrl: vi.fn(),
}));

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()}),
}));

import {
    ConflictError,
    SchedulerUnavailableError,
    UnprocessableError,
} from "../errors/errors.js";
import {validateFeedUrl} from "../lib/scheduler-client.js";
import * as feedRepo from "../repositories/feed.repository.js";
import {
    createFeed,
} from "./feed.service.js";

function makeFeedRow(overrides: Record<string, unknown> = {}) {
    return {
        id: "feed-123",
        userId: "user-abc",
        url: "https://example.com/feed.xml",
        refreshInterval: 1_800_000_000_000,
        errorCount: 0,
        status: "active",
        nextFetchAfter: new Date().toISOString(),
        forceRefresh: true,
        fetchingAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        etag: null,
        lastModifiedHeader: null,
        ...overrides,
    };
}

describe("createFeed", () => {
    const userId = "user-abc";
    const input = {url: "https://example.com/feed.xml", refreshInterval: "30m"};

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls validateFeedUrl with the submitted URL", async () => {
        vi.mocked(validateFeedUrl).mockResolvedValueOnce({title: "Blog", description: ""});
        vi.mocked(feedRepo.createFeed).mockResolvedValueOnce(makeFeedRow());

        await createFeed(userId, input);

        expect(validateFeedUrl).toHaveBeenCalledWith(input.url);
    });

    it("inserts feed with forceRefresh=true and correct nanosecond interval", async () => {
        vi.mocked(validateFeedUrl).mockResolvedValueOnce({title: "Blog", description: ""});
        vi.mocked(feedRepo.createFeed).mockResolvedValueOnce(makeFeedRow());

        await createFeed(userId, input);

        const inserted = vi.mocked(feedRepo.createFeed).mock.calls[0][0];
        expect(inserted.forceRefresh).toBe(true);
        expect(inserted.refreshInterval).toBe(1_800_000_000_000);
        expect(inserted.userId).toBe(userId);
    });

    it("merges title and description from scheduler into returned feed", async () => {
        vi.mocked(validateFeedUrl).mockResolvedValueOnce({title: "My Feed", description: "A great feed"});
        vi.mocked(feedRepo.createFeed).mockResolvedValueOnce(makeFeedRow());

        const result = await createFeed(userId, input);

        expect(result.title).toBe("My Feed");
        expect(result.description).toBe("A great feed");
    });

    it("propagates SchedulerUnavailableError — DB insert never called", async () => {
        vi.mocked(validateFeedUrl).mockRejectedValueOnce(new SchedulerUnavailableError());

        await expect(createFeed(userId, input)).rejects.toBeInstanceOf(SchedulerUnavailableError);
        expect(feedRepo.createFeed).not.toHaveBeenCalled();
    });

    it("propagates UnprocessableError — DB insert never called", async () => {
        vi.mocked(validateFeedUrl).mockRejectedValueOnce(new UnprocessableError("not rss"));

        await expect(createFeed(userId, input)).rejects.toBeInstanceOf(UnprocessableError);
        expect(feedRepo.createFeed).not.toHaveBeenCalled();
    });

    it("converts Postgres 23505 unique violation into ConflictError", async () => {
        vi.mocked(validateFeedUrl).mockResolvedValueOnce({title: "Blog", description: ""});
        vi.mocked(feedRepo.createFeed).mockRejectedValueOnce(
            Object.assign(new Error("duplicate key"), {code: "23505"}),
        );

        await expect(createFeed(userId, input)).rejects.toBeInstanceOf(ConflictError);
    });

    it("re-throws unknown DB errors unchanged", async () => {
        vi.mocked(validateFeedUrl).mockResolvedValueOnce({title: "Blog", description: ""});
        vi.mocked(feedRepo.createFeed).mockRejectedValueOnce(new Error("connection reset"));

        await expect(createFeed(userId, input)).rejects.toThrow("connection reset");
    });
});
