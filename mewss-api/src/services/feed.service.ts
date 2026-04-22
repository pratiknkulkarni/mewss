import { randomUUID } from "node:crypto";
import * as feedRepo from "../repositories/feed.repository.js";
import { z } from "zod";
import { createLogger } from "../lib/logger.js";
import { validateFeedUrl } from "../lib/scheduler-client.js";
import { ConflictError, NotFoundError } from "../errors/errors.js";

const INTERVAL_REGEX = /^(\d+)([mh])$/;
const log = createLogger("service.feed");

export function parseRefreshInterval(refreshInterval: string): number {
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
    refreshInterval: z.number().int("Interval must be a whole number of seconds").min(300, "Minimum refresh interval is 5 minutes")
})

export const updateFeedSchema = z.object({
    refreshInterval: z.number().int("Interval must be a whole number of seconds").min(300, "Minimum refresh interval is 5 minutes").optional(),
    status: z.enum(["active", "paused"]).optional(),
}).refine(
    (data) => data.refreshInterval !== undefined || data.status !== undefined,
    { error: "At least one of refreshInterval or status must be provided" },
);

export async function createFeed(userId: string, createFeedInput: z.infer<typeof createFeedSchema>) {
    const feedURLValidation = await validateFeedUrl(createFeedInput.url);
    log.debug({ userId, url: createFeedInput.url, feedURLValidation }, "feed validation successful")

    try {
        log.info({ userId, url: createFeedInput.url }, "creating feed");

        const now = new Date().toISOString();
        const newFeed = await feedRepo.createFeed({
            id: randomUUID(),
            userId,
            url: createFeedInput.url,
            refreshInterval: convertToNanoseconds(createFeedInput.refreshInterval),
            forceRefresh: true,
            nextFetchAfter: now,
            createdAt: now,
            updatedAt: now,
            title: feedURLValidation.title,
            description: feedURLValidation.description,
        });

        log.info({ userId, url: createFeedInput.url }, "feed added successfully");

        return { ...newFeed, title: feedURLValidation.title, description: feedURLValidation.description };
    } catch (err: any) {
        const errorCode = err?.cause?.code || err?.code;
        if (errorCode === "23505") {
            log.warn({ userId, url: createFeedInput.url }, "duplicate feed subscription attempt");
            throw new ConflictError("You are already subscribed to this feed.");
        }
        log.error({ err, userId }, "feed creation failed");
        throw err;
    }
}

export async function listFeeds(userId: string, status?: string) {
    log.info({ userId, status }, "listing feeds");
    return feedRepo.listFeedsByUser(userId, status);
}

export async function deleteFeed(id: string, userId: string) {
    const deleted = await feedRepo.deleteFeedByIdAndUser(id, userId);
    if (!deleted) {
        log.warn({ id, userId }, "feed not found for deletion")
        throw new NotFoundError();
    }
    log.info({ id, userId }, "feed deleted")
}

export async function refreshFeed(id: string, userId: string) {
    const triggered = await feedRepo.triggerFeedRefresh(id, userId);
    if (!triggered) {
        log.warn({ id, userId }, "feed not found")
        throw new NotFoundError();
    }
    log.info({ id, userId }, "feed refresh triggered")
}

export async function getFeed(id: string, userId: string) {
    const row = await feedRepo.findFeedByIdAndUser(id, userId);
    if (!row) {
        log.warn({ id, userId }, "feed not found");
        throw new NotFoundError();
    }

    log.info({ id, userId }, "feed retrieved")
    return row;
}


export async function updateFeed(id: string, userId: string, input: z.infer<typeof updateFeedSchema>) {
    const existing = await feedRepo.findFeedByIdAndUser(id, userId);
    if (!existing) {
        log.warn({ id, userId }, "feed not found for update");
        throw new NotFoundError();
    }

    const updates: Parameters<typeof feedRepo.updateFeed>[2] = {};

    if (input.refreshInterval !== undefined) {
        const intervalNs = convertToNanoseconds(input.refreshInterval);
        updates.refreshInterval = intervalNs;
        updates.nextFetchAfter = new Date(Date.now() + intervalNs / 1_000_000).toISOString();
    }

    if (input.status !== undefined) {
        updates.status = input.status;
        if (input.status === "active") {
            updates.nextFetchAfter = new Date().toISOString();
        }
    }

    const updated = await feedRepo.updateFeed(id, userId, updates);
    log.info({ id, userId, updates }, "feed updated");
    return updated!;
}

export function convertToNanoseconds(seconds: number): number {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
        throw new Error("Invalid format. Expected an integer representing seconds.");
    }

    if (seconds < 300) {
        throw new Error("Minimum refresh interval is 5 minutes (300 seconds).");
    }

    return seconds * 1_000_000_000; // this is bedcause Go is storing nanoseconds which is in the database
}