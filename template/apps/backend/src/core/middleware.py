"""Pure ASGI middleware: request ID plus one structured log line per request.

It logs the route template (for example /notes/{note_id}), never the raw path,
so IDs and other user data don't end up in logs or metric dimensions.
"""

import time
import uuid
from typing import Any

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from core.errors import internal_error_response
from core.logging import logger
from core.request_context import request_id_var

REQUEST_ID_HEADER = "x-request-id"


def _incoming_request_id(scope: Scope) -> str:
    for name, value in scope.get("headers", []):
        if name == REQUEST_ID_HEADER.encode():
            candidate = str(value.decode("latin-1"))[:64]
            if candidate.replace("-", "").isalnum():
                return candidate
    context: Any = scope.get("aws.context")
    aws_request_id = getattr(context, "aws_request_id", None)
    return str(aws_request_id) if aws_request_id else str(uuid.uuid4())


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = _incoming_request_id(scope)
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        status_code = 500
        response_started = False

        async def send_with_request_id(message: Message) -> None:
            nonlocal status_code, response_started
            if message["type"] == "http.response.start":
                response_started = True
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((REQUEST_ID_HEADER.encode(), request_id.encode()))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        except Exception as exc:
            logger.exception("Unhandled error", extra={"error_type": type(exc).__name__})
            if response_started:
                raise
            await internal_error_response()(scope, receive, send_with_request_id)
        finally:
            route = scope.get("route")
            logger.info(
                "request",
                extra={
                    "request_id": request_id,
                    "method": scope.get("method"),
                    "route": getattr(route, "path", "unmatched"),
                    "status": status_code,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                },
            )
            request_id_var.reset(token)
