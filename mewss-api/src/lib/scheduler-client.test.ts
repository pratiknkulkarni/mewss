import {describe, expect, vi, afterEach, beforeEach, it} from "vitest";
import {validateFeedUrl} from "./scheduler-client.js";
import {SchedulerUnavailableError, UnprocessableError} from "../errors/errors.js";


describe("validateFeedURL", () => {
    // mocking the "fetch" call here
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function makeResponse(status: number, body: unknown): Response {
        return {
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(body),
        } as unknown as Response; // this isn't a "real" response
    }

    it("returns title and description on 200", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            makeResponse(200, {status: "valid", title: "Test Blog", description: "A blog"}),
        );

        const result = await validateFeedUrl("https://example.com/feed.xml");
        expect(result).toEqual({title: "Test Blog", description: "A blog", status: "valid"});
    });

    it("calls the correct scheduler endpoint with the URL in the body", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            makeResponse(200, {status: "valid", title: "X", description: ""}),
        );

        await validateFeedUrl("https://example.com/feed.xml");

        // KEEP THE AWAIT HERE, VITEST REQUIRES IT EVEN IF WEBSTORM SCREAMS
        await expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/v1/feeds/validate"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({url: "https://example.com/feed.xml"}),
            }),
        );
    });

    it("throws UnprocessableError when scheduler returns 400 (invalid RSS)", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            makeResponse(400, {error: "invalid rss feed: no feed element found"}),
        );

        await expect(validateFeedUrl("https://not-rss.example.com"))
            .rejects.toBeInstanceOf(UnprocessableError);
    });

    it("throws UnprocessableError when scheduler returns 422", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            makeResponse(422, {error: "not an rss feed"}),
        );

        await expect(validateFeedUrl("https://not-rss.example.com"))
            .rejects.toBeInstanceOf(UnprocessableError);
    });

    it("uses the scheduler's error message in UnprocessableError", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            makeResponse(400, {error: "invalid rss feed: failed to parse xml"}),
        );

        await expect(validateFeedUrl("https://example.com"))
            .rejects.toThrow("invalid rss feed: failed to parse xml");
    });

    it("uses fallback message when scheduler body has no error field", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeResponse(400, {}));

        await expect(validateFeedUrl("https://example.com"))
            .rejects.toThrow("URL is not a valid RSS or Atom feed");
    });

    it("throws SchedulerUnavailableError on 500", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeResponse(500, {}));

        await expect(validateFeedUrl("https://example.com/feed.xml"))
            .rejects.toBeInstanceOf(SchedulerUnavailableError);
    });

    it("throws SchedulerUnavailableError when fetch throws (network down)", async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error("ECONNREFUSED"));

        await expect(validateFeedUrl("https://example.com/feed.xml"))
            .rejects.toBeInstanceOf(SchedulerUnavailableError);
    });

    it("throws SchedulerUnavailableError on timeout", async () => {
        const timeoutErr = Object.assign(new Error("Aborted"), {name: "TimeoutError"});
        vi.mocked(fetch).mockRejectedValueOnce(timeoutErr);

        await expect(validateFeedUrl("https://example.com/feed.xml"))
            .rejects.toBeInstanceOf(SchedulerUnavailableError);
    });


})