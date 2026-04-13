export class ApiError extends Error {
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
