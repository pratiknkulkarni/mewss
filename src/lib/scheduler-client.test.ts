import {describe, expect, vi, afterEach, beforeEach, it} from "vitest";
import {validateFeedUrl} from "./scheduler-client.js";


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

})