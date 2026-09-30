/**
 * Every API failure, parsed from the backend's error envelope:
 *   {"error": {"code", "message", "request_id", "fields"}}
 * Network failures (no response) get status 0 and code NETWORK_ERROR.
 */

export interface ApiFieldError {
  field: string;
  message: string;
  type: string;
}

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    request_id?: string | null;
    fields?: ApiFieldError[] | null;
  };
}

function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  if (typeof body !== 'object' || body === null || !('error' in body)) return false;
  const { error } = body;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly fields: ApiFieldError[];

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string | null = null,
    fields: ApiFieldError[] = [],
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.fields = fields;
  }

  static fromResponse(status: number, body: unknown): ApiError {
    if (isErrorEnvelope(body)) {
      const { code, message, request_id, fields } = body.error;
      return new ApiError(status, code, message, request_id ?? null, fields ?? []);
    }
    return new ApiError(status, `HTTP_${status}`, `Request failed with status ${status}.`);
  }

  static network(cause: unknown): ApiError {
    const error = new ApiError(0, 'NETWORK_ERROR', 'The server could not be reached.');
    error.cause = cause;
    return error;
  }

  /** Message for one field, for showing next to the matching input. */
  fieldError(field: string): string | undefined {
    return this.fields.find((item) => item.field === field)?.message;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
