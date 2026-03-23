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