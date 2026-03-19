import {createLogger} from "./logger.js";

const SCHEDULER_URL = process.env.SCHEDULER_URL ?? "http://localhost:8081";

export interface ValidateFeedResult {
    title: string,
    description: string,
}

const log = createLogger("scheduler-client");

export async function validateFeedUrl(url: string): Promise<ValidateFeedResult> {
    let response: Response;

    try {
        response = await fetch(`${SCHEDULER_URL}/v1/feeds/validate`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({url}),
            signal: AbortSignal.timeout(10_000),
        });
    } catch (err) {
        log.error({url, err}, "Network or timeout error reaching scheduler client");
        throw new Error("scheduler unavailable") ;
    }

    if (!response.ok) {
        log.error({url, status: response.status}, "Scheduler rejected feed validation");
        throw new Error("scheduler unavailable") ;
    }

    try {
        const data = await response.json();
        log.debug({url}, "Scheduler client feed validation successful");

        return data;
    } catch (err) {
        log.error({url, err}, "Failed to parse scheduler response as JSON");
        throw new Error("Invalid JSON response from scheduler");
    }
}
