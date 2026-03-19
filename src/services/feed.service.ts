import {randomUUID} from "node:crypto";
import * as feedRepo from "../repository/feed.repository.js";
import {z} from "zod";
import {createLogger} from "../lib/logger.js";
import {validateFeedUrl} from "../lib/scheduler-client.js";

const INTERVAL_REGEX = /^(\d+)([mh])$/;
const log = createLogger("service.feed");

function parseRefreshInterval(refreshInterval: string): number {
    const match = refreshInterval.match(INTERVAL_REGEX);

    if (!match) {
        throw new Error('Invalid format. Use e.g. "30m" or "1h".');
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const seconds = unit === "m" ? amount * 60 : amount * 3600;

    if (seconds < 300) {
        throw new Error("Minimum refresh interval is 5 minutes.");
    }

    if (seconds > 86400) {
        throw new Error("Maximum refresh interval is 24 hours.");
    }

    // this one matches Go time.Duration
    return 1_000_000_000 * seconds;
}

export const createFeedSchema = z.object({
    url: z.url(),
    refreshInterval: z.string()
        .regex(INTERVAL_REGEX, "Use a string like 10m or 1h")
        .refine((v) => {
            // const match = v.match(INTERVAL_REGEX);
            // if (!match) {
            //     throw new Error('Invalid format. Use e.g. "30m" or "1h".');
            // }
            //
            // const amount = parseInt(match[1], 10);
            // const unit = match[2];
            // const seconds = unit === "m" ? amount * 60 : amount * 3600;
            //
            // if (seconds < 300) {
            //     throw new Error("Minimum refresh interval is 5 minutes.");
            // }
            //
            // if (seconds > 86400) {
            //     throw new Error("Maximum refresh interval is 24 hours.");
            // }
            try {
                parseRefreshInterval(v);
                return true;
            } catch (error) {
                return false;
            }
        }, {
            error: "Interval must be between 5m and 24h"
        })
})

export async function createFeed(userId: string, createFeedInput: z.infer<typeof createFeedSchema>) {
    const feedURLValidation = await validateFeedUrl(createFeedInput.url);
    // console.log(feedURLValidation);
    log.debug({userId, url: createFeedInput.url, feedURLValidation})

    try {
        log.info({userId, url: createFeedInput.url}, "creating feed");

        const now = new Date().toISOString();
        const newFeed = await feedRepo.createFeed({
            id: randomUUID(),
            userId,
            url: createFeedInput.url,
            refreshInterval: parseRefreshInterval(createFeedInput.refreshInterval),
            forceRefresh: true,
            nextFetchAfter: now,
            createdAt: now,
            updatedAt: now,
        });

        log.info({userId, url: createFeedInput.url}, "feed added successfully");

        return {...newFeed, title: feedURLValidation.title, description: feedURLValidation.description};
    } catch (err: any) {
        if (err?.code === "23505") {
            log.error({err, userId}, "duplicate feed detected");
        }
        log.error({err, userId}, "feed creation failed");
        throw err;
    }
}