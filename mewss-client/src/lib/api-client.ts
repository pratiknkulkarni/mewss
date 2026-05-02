import { ApiError } from "./api-error.ts";

/**
 * Base URL for API requests.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Converts a record of parameters into a URL search string.
 *
 * @param params - A record of key-value pairs to be converted.
 * @returns A formatted query string starting with '?' or an empty string if no valid parameters exist.
 */
function buildSearch(params: Record<string, unknown>): string {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            sp.set(key, String(value));
        }
    }
    const str = sp.toString();
    return str ? `?${str}` : "";
}

/**
 * Core request function to handle fetch calls, set headers, and process responses.
 *
 * @template T - The expected return type of the response data.
 * @param path - The API endpoint path.
 * @param options - Standard RequestInit options for the fetch call.
 * @param params - Optional query parameters.
 * @returns A promise that resolves to the parsed response data.
 * @throws {ApiError} If the response is not OK, it throws an ApiError with message and status code.
 */
async function request<T>(
    path: string,
    options: RequestInit,
    params?: Record<string, unknown>,
): Promise<T> {
    const search = params ? buildSearch(params) : "";
    const url = `${BASE_URL}${path}${search}`;

    const response = await fetch(url, {
        ...options,
        credentials: "include", // better auth cookie
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
        const apiErr = data?.error;
        throw new ApiError(
            apiErr?.message ?? "An unexpected error occurred",
            apiErr?.code ?? "UNKNOWN_ERROR",
            response.status,
        );
    }

    return data as T;
}

/**
 * API client providing convenience methods for common HTTP verbs.
 */
export const apiClient = {
    /**
     * Performs a GET request.
     *
     * @template T - The expected return type.
     * @param path - The API endpoint path.
     * @param params - Optional query parameters.
     * @returns A promise that resolves to the response data.
     */
    get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
        return request<T>(path, { method: "GET" }, params);
    },

    /**
     * Performs a POST request.
     *
     * @template T - The expected return type.
     * @param path - The API endpoint path.
     * @param body - The request payload.
     * @returns A promise that resolves to the response data.
     */
    post<T>(path: string, body?: unknown): Promise<T> {
        return request<T>(path, {
            method: "POST",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    },

    /**
     * Performs a PATCH request.
     *
     * @template T - The expected return type.
     * @param path - The API endpoint path.
     * @param body - The request payload.
     * @returns A promise that resolves to the response data.
     */
    patch<T>(path: string, body?: unknown): Promise<T> {
        return request<T>(path, {
            method: "PATCH",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    },

    /**
     * Performs a DELETE request.
     *
     * @template T - The expected return type.
     * @param path - The API endpoint path.
     * @returns A promise that resolves when the deletion is complete.
     */
    delete<T = void>(path: string): Promise<T> {
        return request<T>(path, { method: "DELETE" });
    },
}

