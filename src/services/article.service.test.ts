// GENERATED USING Claude based on the feed.service.test.ts as a reference
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../repositories/feed.repository.js", () => ({
    findFeedByIdAndUser: vi.fn(),
    findFeedsByIdsAndUser: vi.fn(),
}));

vi.mock("../repositories/article.repository.js", () => ({
    findArticleByIdAndUser: vi.fn(),
    listArticlesByFeed: vi.fn(),
    countArticlesByFeedAndUser: vi.fn(),
    listArticlesGlobal: vi.fn(),
    countArticlesGlobal: vi.fn(),
    markArticleAsRead: vi.fn(),
    markArticleAsUnread: vi.fn(),
    markAllArticlesAsRead: vi.fn(),
    markAllArticlesAsUnread: vi.fn(),
    markAllArticlesAsReadGlobal: vi.fn(),
    markAllArticlesAsReadForFeeds: vi.fn(),
    markAllArticlesAsUnreadForFeeds: vi.fn(),
}));

import {NotFoundError} from "../errors/errors.js";
import * as feedRepo from "../repositories/feed.repository.js";
import * as articleRepo from "../repositories/article.repository.js";
import {
    buildPagination,
    listArticlesForFeed,
    listArticlesGlobal,
    markAllArticlesRead,
    markArticleRead,
    markFeedArticlesRead, markFeedArticlesUnread, markFeedsBulkRead, markFeedsBulkUnread,
} from "./article.service.js";
import type {ArticleWithReadState} from "../repositories/article.repository.js";

function makeFeedRow(overrides: Record<string, unknown> = {}) {
    return {
        id: "feed-123",
        userId: "user-abc",
        url: "https://example.com/feed.xml",
        refreshInterval: 1_800_000_000_000,
        status: "active",
        ...overrides,
    };
}

function makeArticle(overrides: Partial<ArticleWithReadState> = {}): ArticleWithReadState {
    return {
        id: "article-123",
        feedId: "feed-123",
        userId: "user-abc",
        title: "Test Article",
        url: "https://example.com/article",
        guid: null,
        author: null,
        summary: null,
        identityHash: "abc123",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isRead: false,
        readAt: null,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("buildPagination", () => {
    it("returns correct shape", () => {
        expect(buildPagination(1, 20, 50)).toEqual({
            page: 1, limit: 20, total: 50, hasMore: true,
        });
    });

    it("hasMore is false when all items fit on one page", () => {
        expect(buildPagination(1, 20, 10).hasMore).toBe(false);
    });

    it("hasMore is false on the last page", () => {
        // 3 pages of 20, we're on page 3 with total 60
        expect(buildPagination(3, 20, 60).hasMore).toBe(false);
    });

    it("hasMore is true when more pages remain", () => {
        expect(buildPagination(1, 20, 21).hasMore).toBe(true);
        expect(buildPagination(2, 20, 50).hasMore).toBe(true);
    });

    it("hasMore is false when total is 0", () => {
        expect(buildPagination(1, 20, 0).hasMore).toBe(false);
    });
});

describe("listArticlesForFeed", () => {
    const query = {page: 1, limit: 20, unread: undefined};

    it("throws NotFoundError when feed does not exist", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(null);

        await expect(
            listArticlesForFeed("missing-feed", "user-abc", query)
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("returns articles and pagination when feed exists", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(makeFeedRow() as any);
        vi.mocked(articleRepo.listArticlesByFeed).mockResolvedValueOnce([makeArticle()]);
        vi.mocked(articleRepo.countArticlesByFeedAndUser).mockResolvedValueOnce(1);

        const result = await listArticlesForFeed("feed-123", "user-abc", query);

        expect(result.articles).toHaveLength(1);
        expect(result.pagination).toEqual({page: 1, limit: 20, total: 1, hasMore: false});
    });

    it("does not call article repo when feed check fails", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(null);

        await expect(
            listArticlesForFeed("missing", "user-abc", query)
        ).rejects.toBeInstanceOf(NotFoundError);

        expect(articleRepo.listArticlesByFeed).not.toHaveBeenCalled();
    });

    it("passes unread filter through to repository", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(makeFeedRow() as any);
        vi.mocked(articleRepo.listArticlesByFeed).mockResolvedValueOnce([]);
        vi.mocked(articleRepo.countArticlesByFeedAndUser).mockResolvedValueOnce(0);

        await listArticlesForFeed("feed-123", "user-abc", {page: 1, limit: 20, unread: true});

        expect(articleRepo.listArticlesByFeed).toHaveBeenCalledWith(
            "feed-123", "user-abc", {page: 1, limit: 20, unread: true}
        );
    });
});

describe("listArticlesGlobal", () => {
    it("returns articles and pagination", async () => {
        vi.mocked(articleRepo.listArticlesGlobal).mockResolvedValueOnce([makeArticle()]);
        vi.mocked(articleRepo.countArticlesGlobal).mockResolvedValueOnce(1);

        const result = await listArticlesGlobal("user-abc", {page: 1, limit: 20, unread: undefined});

        expect(result.articles).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
    });

    it("passes feedId filter to repository", async () => {
        vi.mocked(articleRepo.listArticlesGlobal).mockResolvedValueOnce([]);
        vi.mocked(articleRepo.countArticlesGlobal).mockResolvedValueOnce(0);

        await listArticlesGlobal("user-abc", {page: 1, limit: 20, unread: undefined, feedId: "feed-123"});

        expect(articleRepo.listArticlesGlobal).toHaveBeenCalledWith(
            "user-abc",
            expect.objectContaining({feedId: "feed-123"}),
        );
    });
});

describe("markArticleRead", () => {
    it("returns updated article with isRead=true", async () => {
        const article = makeArticle({isRead: true, readAt: new Date().toISOString()});
        vi.mocked(articleRepo.markArticleAsRead).mockResolvedValueOnce(article);

        const result = await markArticleRead("article-123", "user-abc");
        expect(result.isRead).toBe(true);
    });

    it("throws NotFoundError when repo returns null", async () => {
        vi.mocked(articleRepo.markArticleAsRead).mockResolvedValueOnce(null);

        await expect(markArticleRead("missing", "user-abc")).rejects.toBeInstanceOf(NotFoundError);
    });
});

describe("markFeedArticlesRead", () => {
    it("returns updatedCount when feed exists", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(makeFeedRow() as any);
        vi.mocked(articleRepo.markAllArticlesAsRead).mockResolvedValueOnce(5);

        expect(await markFeedArticlesRead("feed-123", "user-abc")).toEqual({updatedCount: 5});
    });

    it("throws NotFoundError when feed does not exist", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(null);

        await expect(markFeedArticlesRead("missing", "user-abc")).rejects.toBeInstanceOf(NotFoundError);
        expect(articleRepo.markAllArticlesAsRead).not.toHaveBeenCalled();
    });
});

describe("markAllArticlesRead", () => {
    it("returns updatedCount from repository", async () => {
        vi.mocked(articleRepo.markAllArticlesAsReadGlobal).mockResolvedValueOnce(10);

        expect(await markAllArticlesRead("user-abc")).toEqual({updatedCount: 10});
    });

    it("returns 0 when user has no articles", async () => {
        vi.mocked(articleRepo.markAllArticlesAsReadGlobal).mockResolvedValueOnce(0);

        expect(await markAllArticlesRead("user-abc")).toEqual({updatedCount: 0});
    });
});

describe("markFeedArticlesUnread", () => {
    it("returns updatedCount when feed exists", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(makeFeedRow() as any);
        vi.mocked(articleRepo.markAllArticlesAsUnread).mockResolvedValueOnce(3);

        expect(await markFeedArticlesUnread("feed-123", "user-abc")).toEqual({updatedCount: 3});
    });

    it("throws NotFoundError when feed does not exist", async () => {
        vi.mocked(feedRepo.findFeedByIdAndUser).mockResolvedValueOnce(null);

        await expect(markFeedArticlesUnread("missing", "user-abc")).rejects.toBeInstanceOf(NotFoundError);
        expect(articleRepo.markAllArticlesAsUnread).not.toHaveBeenCalled();
    });
});


describe("markFeedsBulkRead", () => {
    it("returns updatedCount when all feedIds belong to the user", async () => {
        const feedIds = ["feed-1", "feed-2"];
        vi.mocked(feedRepo.findFeedsByIdsAndUser).mockResolvedValueOnce([
            makeFeedRow({id: "feed-1"}) as any,
            makeFeedRow({id: "feed-2"}) as any,
        ]);
        vi.mocked(articleRepo.markAllArticlesAsReadForFeeds).mockResolvedValueOnce(8);

        expect(await markFeedsBulkRead(feedIds, "user-abc")).toEqual({updatedCount: 8});
    });

    it("throws NotFoundError when any feedId does not belong to the user", async () => {
        // Request 2 feeds, only 1 found
        vi.mocked(feedRepo.findFeedsByIdsAndUser).mockResolvedValueOnce([
            makeFeedRow({id: "feed-1"}) as any,
        ]);

        await expect(
            markFeedsBulkRead(["feed-1", "feed-unknown"], "user-abc")
        ).rejects.toBeInstanceOf(NotFoundError);

        expect(articleRepo.markAllArticlesAsReadForFeeds).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when no feeds found", async () => {
        vi.mocked(feedRepo.findFeedsByIdsAndUser).mockResolvedValueOnce([]);

        await expect(
            markFeedsBulkRead(["feed-1"], "user-abc")
        ).rejects.toBeInstanceOf(NotFoundError);
    });
});

describe("markFeedsBulkUnread", () => {
    it("returns updatedCount when all feedIds belong to the user", async () => {
        const feedIds = ["feed-1"];
        vi.mocked(feedRepo.findFeedsByIdsAndUser).mockResolvedValueOnce([
            makeFeedRow({id: "feed-1"}) as any,
        ]);
        vi.mocked(articleRepo.markAllArticlesAsUnreadForFeeds).mockResolvedValueOnce(4);

        expect(await markFeedsBulkUnread(feedIds, "user-abc")).toEqual({updatedCount: 4});
    });

    it("throws NotFoundError when any feedId does not belong to the user", async () => {
        vi.mocked(feedRepo.findFeedsByIdsAndUser).mockResolvedValueOnce([]);

        await expect(
            markFeedsBulkUnread(["feed-unknown"], "user-abc")
        ).rejects.toBeInstanceOf(NotFoundError);

        expect(articleRepo.markAllArticlesAsUnreadForFeeds).not.toHaveBeenCalled();
    });
});