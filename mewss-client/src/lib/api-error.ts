/**
 * Custom error class for API-related issues.
 *
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   *
   * @param message - The descriptive error message.
   * @param code - A machine-readable error code (e.g., 'NOT_FOUND').
   * @param status - The HTTP status code returned by the server.
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
