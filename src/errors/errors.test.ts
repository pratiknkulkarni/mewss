import {
    AppError,
    ConflictError,
    NotFoundError, SchedulerUnavailableError,
    UnauthorizedError,
    UnprocessableError,
    ValidationError
} from "./errors.js";
import {describe, expect, it} from "vitest";


describe("AppError", () => {
    it("stores statusCode, code, and message", () => {
        const err = new AppError(418, "KITTENS_ARE_SMOLL", "kittens are smaller than cats");
        expect(err.statusCode).toBe(418);
        expect(err.code).toBe("KITTENS_ARE_SMOLL");
        expect(err.message).toBe("kittens are smaller than cats");
    });

    it("is an instance of Error", () => {
        expect(new AppError(500, "X", "msg")).toBeInstanceOf(Error);
    });
});


describe("ValidationError", () => {
    it("has statusCode 400 and code VALIDATION_ERROR", () => {
        const err = new ValidationError("bad input");
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe("VALIDATION_ERROR");
    });

    it("stores field-level details", () => {
        const details = [{field: "url", message: "Invalid URL"}];
        const err = new ValidationError("bad input", details);
        expect(err.details).toEqual(details);
    });

    it("defaults details to empty array", () => {
        expect(new ValidationError("x").details).toEqual([]);
    });
});

describe("UnauthorizedError", () => {
    it("has statusCode 401 and code UNAUTHORIZED", () => {
        expect(new UnauthorizedError().statusCode).toBe(401);
        expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
    });

    it("uses default message", () => {
        expect(new UnauthorizedError().message).toBe("Unauthorized");
    });

    it("accepts a custom message", () => {
        expect(new UnauthorizedError("Session expired").message).toBe("Session expired");
    });
});

describe("NotFoundError", () => {
    it("has statusCode 404 and code NOT_FOUND", () => {
        expect(new NotFoundError().statusCode).toBe(404);
        expect(new NotFoundError().code).toBe("NOT_FOUND");
    });
});

describe("ConflictError", () => {
    it("has statusCode 409 and code CONFLICT", () => {
        const err = new ConflictError("Already subscribed");
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe("CONFLICT");
        expect(err.message).toBe("Already subscribed");
    });
});

describe("UnprocessableError", () => {
    it("has statusCode 422 and code INVALID_FEED", () => {
        const err = new UnprocessableError("Not a valid RSS feed");
        expect(err.statusCode).toBe(422);
        expect(err.code).toBe("INVALID_FEED");
    });
});

describe("SchedulerUnavailableError", () => {
    it("has statusCode 503 and code SCHEDULER_UNAVAILABLE", () => {
        expect(new SchedulerUnavailableError().statusCode).toBe(503);
        expect(new SchedulerUnavailableError().code).toBe("SCHEDULER_UNAVAILABLE");
    });

    it("uses default message", () => {
        expect(new SchedulerUnavailableError().message).toBe("Feed validator is unavailable");
    });
});

// adding this as per recommendations from Claude
describe("instanceof checks across hierarchy", () => {
    it("every subclass is instanceof AppError and Error", () => {
        const errors = [
            new ValidationError("x"),
            new UnauthorizedError(),
            new NotFoundError(),
            new ConflictError("x"),
            new UnprocessableError("x"),
            new SchedulerUnavailableError(),
        ];
        for (const err of errors) {
            expect(err).toBeInstanceOf(AppError);
            expect(err).toBeInstanceOf(Error);
        }
    });

    it("subclasses are not instanceof each other", () => {
        expect(new NotFoundError()).not.toBeInstanceOf(ConflictError);
        expect(new ConflictError("x")).not.toBeInstanceOf(ValidationError);
    });
});