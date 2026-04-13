//TODO: get this from the env
import {ApiError} from "./api-error.ts";

const BASE_URL: string = "http://localhost:3333";

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

export const apiClient = {
    get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
        return request<T>(path, {method: "GET"}, params);
    },
    post<T>(path: string, body?: unknown): Promise<T> {
        return request<T>(path, {
            method: "POST",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
        return request<T>(path, {
            method: "PATCH",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    },
    delete<T = void>(path: string): Promise<T> {
        return request<T>(path, {method: "DELETE"});
    },
}

