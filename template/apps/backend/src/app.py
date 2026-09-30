"""API entry point.

Local:  uv run uvicorn app:app --app-dir src --reload
Lambda: handler `app.handler` (see infra/api.yaml)
"""

import asyncio
from typing import Any

from aws_lambda_powertools.logging import correlation_paths
from fastapi import FastAPI
from fastapi.routing import APIRoute
from mangum import Mangum

from core.config import get_settings
from core.errors import register_error_handlers
from core.logging import logger
from core.middleware import RequestContextMiddleware
from features.health.router import router as health_router
from features.notes.router import router as notes_router


def _operation_id(route: APIRoute) -> str:
    # Stable operationIds (the function name) keep the generated frontend types readable.
    return route.name


def create_app() -> FastAPI:
    settings = get_settings()
    show_docs = settings.app_env != "prod"
    app = FastAPI(
        title="API",
        version=settings.app_version,
        openapi_url="/openapi.json" if show_docs else None,
        docs_url="/docs" if show_docs else None,
        redoc_url=None,
        generate_unique_id_function=_operation_id,
    )
    app.add_middleware(RequestContextMiddleware)
    register_error_handlers(app)
    app.include_router(health_router)
    app.include_router(notes_router)
    return app


app = create_app()
_mangum = Mangum(app, lifespan="off")
_loop: asyncio.AbstractEventLoop | None = None


def _event_loop() -> asyncio.AbstractEventLoop:
    """One loop per execution environment, created on first invocation.

    Mangum calls asyncio.get_event_loop(), which raises on Python 3.14 when the
    thread has no current loop (the Lambda runtime's case). Reusing one loop
    keeps pooled asyncpg connections valid across invocations; creating it
    lazily keeps it out of SnapStart snapshots.
    """
    global _loop
    if _loop is None or _loop.is_closed():
        _loop = asyncio.new_event_loop()
    return _loop


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP, clear_state=True)
def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    asyncio.set_event_loop(_event_loop())
    return _mangum(event, context)
