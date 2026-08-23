// Typed application errors + a safe converter for Server Action responses.
// End users never see stack traces, DB errors or internal details.
import { logger } from "@/lib/logger";

export class AppError extends Error {
  constructor(
    message,
    { code = "APP_ERROR", status = 400, fieldErrors = null } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export class ValidationError extends AppError {
  constructor(
    fieldErrors = {},
    message = "Please fix the highlighted fields."
  ) {
    super(message, { code: "VALIDATION_ERROR", status: 422, fieldErrors });
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "You must be signed in to do that.") {
    super(message, { code: "UNAUTHENTICATED", status: 401 });
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, { code: "FORBIDDEN", status: 403 });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, { code: "NOT_FOUND", status: 404 });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "That action was already performed.") {
    super(message, { code: "CONFLICT", status: 409 });
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "You're doing that too fast. Please wait a moment.") {
    super(message, { code: "RATE_LIMITED", status: 429 });
    this.name = "RateLimitError";
  }
}

/** Standard success envelope for Server Actions. */
export function actionOk(data = null) {
  return { ok: true, data, error: null };
}

/** Convert any thrown error into a safe Server Action envelope. */
export function toActionError(error) {
  if (error instanceof AppError) {
    return {
      ok: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
      },
    };
  }
  logger.error("Unexpected action error", error);
  return {
    ok: false,
    data: null,
    error: {
      code: "INTERNAL",
      message: "Something went wrong. Please try again.",
      fieldErrors: null,
    },
  };
}
