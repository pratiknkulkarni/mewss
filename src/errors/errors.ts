export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(401, "UNAUTHORIZED", message);
    }
}

export class SchedulerUnavailableError extends AppError {
    constructor(message = "Feed validator is unavailable") {
        super(503, "SCHEDULER_UNAVAILABLE", message);
    }
}