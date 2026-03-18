import {randomUUID} from "node:crypto";
import * as feedRepo from "../repository/feed.repository.js";
import {z} from "zod";

const INTERVAL_REGEX = /^(\d+)([mh])$/;

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
    try {
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

        return {...newFeed};
    } catch (err: any) {
        if (err?.code === "23505") {
            console.error("Feed already exists")
        }
        throw err;
    }
}