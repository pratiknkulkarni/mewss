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

export class UnprocessableError extends AppError {
    constructor(message: string) {
        super(422, "INVALID_FEED", message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, "CONFLICT", message);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not found") {
        super(404, "NOT_FOUND", message);
    }
}

export class ValidationError extends AppError {
    constructor(
        message: string,
        public readonly details: { field: string; message: string }[] = [],
    ) {
        super(400, "VALIDATION_ERROR", message);
    }
}