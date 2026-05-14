import {createLogger} from "./logger.js";
import {SchedulerUnavailableError, UnprocessableError} from "../errors/errors.js";

const SCHEDULER_URL = process.env.SCHEDULER_URL ?? "http://localhost:8081";

export interface ValidateFeedResult {
    title: string,
    description: string,
}

const log = createLogger("client.scheduler");

export async function validateFeedUrl(url: string): Promise<ValidateFeedResult> {
    let response: Response;

    try {
        response = await fetch(`${SCHEDULER_URL}/v1/feeds/validate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Internal-Secret": process.env.INTERNAL_API_SECRET!
            },
            body: JSON.stringify({url}),
            signal: AbortSignal.timeout(10_000),
        });
    } catch (err) {
        log.error({url, err}, "Network or timeout error reaching scheduler client");
        throw new SchedulerUnavailableError();
    }

    if (response.status === 422 || response.status === 400) {
        const body = await response.json().catch(() => ({}));
        throw new UnprocessableError(body?.error ?? "URL is not a valid RSS or Atom feed");
    }

    if (!response.ok) {
        log.error({url, status: response.status}, "Scheduler rejected feed validation");
        throw new SchedulerUnavailableError();
    }

    log.info({url, status: response.status}, "feed validation successful")
    return response.json();
}
