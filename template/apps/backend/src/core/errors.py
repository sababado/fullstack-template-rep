"""One error shape for every failure the API returns.

    {"error": {"code": "NOTE_NOT_FOUND", "message": "Note not found.",
               "request_id": "...", "fields": null}}

`code` is stable and machine-readable (the frontend maps it to a translated
message). `message` is safe to show a user and never contains exception text.
Raise an AppError subclass from services; never raise HTTPException there.
"""

from collections.abc import Mapping
from typing import Any, ClassVar, cast

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.logging import logger
from core.request_context import current_request_id


class AppError(Exception):
    status_code: ClassVar[int] = 500
    code: ClassVar[str] = "INTERNAL_ERROR"
    message: ClassVar[str] = "Something went wrong."

    def __init__(self, message: str | None = None, *, headers: dict[str, str] | None = None) -> None:
        self.safe_message = message or self.message
        self.headers = headers
        super().__init__(self.safe_message)


class BadRequestError(AppError):
    status_code = 400
    code = "BAD_REQUEST"
    message = "The request is invalid."


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHORIZED"
    message = "Sign in to continue."


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    message = "You don't have permission to do that."


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    message = "Not found."


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
    message = "That conflicts with the current state."


class ErrorField(BaseModel):
    field: str
    message: str
    type: str


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str | None = None
    fields: list[ErrorField] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


# Documented on every route so the generated frontend types know the shape.
ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    status: {"model": ErrorResponse} for status in (400, 401, 403, 404, 409, 422, 500)
}

_HTTP_STATUS_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    429: "TOO_MANY_REQUESTS",
}


def _response(
    status: int,
    code: str,
    message: str,
    *,
    fields: list[ErrorField] | None = None,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    body = ErrorResponse(
        error=ErrorBody(code=code, message=message, request_id=current_request_id(), fields=fields)
    )
    return JSONResponse(body.model_dump(), status_code=status, headers=dict(headers) if headers else None)


def _field_name(loc: tuple[int | str, ...]) -> str:
    # ("body", "title") -> "title"; ("query", "limit") -> "limit"
    parts = [str(part) for part in loc if part not in ("body", "query", "path", "header")]
    return ".".join(parts) or "request"


# Starlette types every handler as (Request, Exception); each is only
# registered for its own exception class, so the casts are safe.
async def _app_error(_: Request, error: Exception) -> JSONResponse:
    exc = cast(AppError, error)
    log = logger.error if exc.status_code >= 500 else logger.warning
    log("Request failed", extra={"error_code": exc.code, "status": exc.status_code})
    return _response(exc.status_code, exc.code, exc.safe_message, headers=exc.headers)


async def _validation_error(_: Request, error: Exception) -> JSONResponse:
    exc = cast(RequestValidationError, error)
    fields = [
        ErrorField(field=_field_name(tuple(err["loc"])), message=err["msg"], type=err["type"])
        for err in exc.errors()
    ]
    return _response(422, "VALIDATION_ERROR", "Some fields need attention.", fields=fields)


async def _http_error(_: Request, error: Exception) -> JSONResponse:
    exc = cast(StarletteHTTPException, error)
    code = _HTTP_STATUS_CODES.get(exc.status_code, "HTTP_ERROR")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return _response(exc.status_code, code, message, headers=exc.headers)


def internal_error_response() -> JSONResponse:
    """The 500 body for unexpected exceptions. Sent by RequestContextMiddleware."""
    return _response(500, AppError.code, AppError.message)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(StarletteHTTPException, _http_error)
    # Unexpected exceptions are caught by core.middleware.RequestContextMiddleware,
    # which logs them and sends internal_error_response() with the request ID.
