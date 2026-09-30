"""App wiring that doesn't need a database: health, error envelope, request IDs."""

from collections.abc import AsyncIterator
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app import create_app, handler
from features import import_all_models


@pytest.fixture
def app() -> FastAPI:
    app = create_app()

    @app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("secret internal detail")

    return app


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


async def test_health(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "test"}
    assert response.headers["x-request-id"]


async def test_request_id_is_echoed_when_valid(client: AsyncClient) -> None:
    response = await client.get("/health", headers={"x-request-id": "abc-123"})

    assert response.headers["x-request-id"] == "abc-123"


async def test_unknown_route_uses_error_envelope(client: AsyncClient) -> None:
    response = await client.get("/nope")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


async def test_unhandled_errors_hide_details(client: AsyncClient) -> None:
    response = await client.get("/boom", headers={"x-request-id": "req-1"})

    assert response.status_code == 500
    assert response.json() == {
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "Something went wrong.",
            "request_id": "req-1",
            "fields": None,
        }
    }
    assert "secret" not in response.text


def test_every_route_documents_the_error_shape(app: FastAPI) -> None:
    schema = app.openapi()
    assert "ErrorResponse" in schema["components"]["schemas"]
    assert schema["paths"]["/notes"]["get"]["operationId"] == "list_notes"


def test_models_are_discovered() -> None:
    assert "features.notes.models" in import_all_models()


def test_lambda_handler_serves_http_api_events() -> None:
    event = {
        "version": "2.0",
        "routeKey": "GET /health",
        "rawPath": "/health",
        "rawQueryString": "",
        "headers": {"host": "example.execute-api.us-east-1.amazonaws.com"},
        "requestContext": {
            "http": {"method": "GET", "path": "/health", "protocol": "HTTP/1.1", "sourceIp": "127.0.0.1"},
            "requestId": "req-lambda",
            "stage": "$default",
        },
        "isBase64Encoded": False,
    }

    class Context:
        function_name = "api"
        memory_limit_in_mb = 512
        invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:api"
        aws_request_id = "req-lambda"

    # Run in a fresh thread with no event loop, the way the Lambda runtime calls
    # handlers. Python 3.14's asyncio.get_event_loop() raises there, so this
    # catches any regression in app.handler's loop setup. Two calls check that
    # the loop (and its pooled connections) survives between invocations.
    with ThreadPoolExecutor(max_workers=1) as pool:
        first = pool.submit(handler, event, Context()).result()
        second = pool.submit(handler, event, Context()).result()

    assert first["statusCode"] == second["statusCode"] == 200
