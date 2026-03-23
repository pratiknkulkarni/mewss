import {AppError, ValidationError} from "./errors.js";
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