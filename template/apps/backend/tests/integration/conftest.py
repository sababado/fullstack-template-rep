"""Database fixtures for integration tests.

The database comes from TEST_DATABASE_URL when set (CI, or your local Postgres),
otherwise from a throwaway Postgres 18 container (needs Docker). The schema is
rebuilt with Alembic once per run; each test runs inside a transaction that is
rolled back, so tests never see each other's data.
"""

import os
from collections.abc import AsyncIterator, Callable, Iterator
from urllib.parse import urlsplit

import asyncpg
import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import Connection, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine

from app import create_app
from core.auth import Principal, get_principal
from core.database import get_session
from handlers.migrate import MIGRATIONS_DIR


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    # Everything under tests/integration is marked, so `pytest -m "not integration"`
    # runs the fast suite without a database.
    for item in items:
        if "tests/integration" in str(item.path):
            item.add_marker(pytest.mark.integration)


def _database_name(url: str) -> str:
    return urlsplit(url).path.lstrip("/")


@pytest.fixture(scope="session")
def database_url() -> Iterator[str]:
    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        # The suite drops and recreates the schema: refuse anything that isn't a test DB.
        if not _database_name(url).endswith("_test"):
            raise pytest.UsageError("TEST_DATABASE_URL must point at a database whose name ends in _test.")
        yield url
        return
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("postgres:18-alpine", dbname="app_test", driver="asyncpg") as postgres:
        yield postgres.get_connection_url()


async def _ensure_database(url: str) -> None:
    parts = urlsplit(url.replace("+asyncpg", ""))
    name = _database_name(url)
    admin = await asyncpg.connect(parts._replace(path="/postgres").geturl())
    try:
        exists = await admin.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", name)
        if not exists:
            await admin.execute(f'CREATE DATABASE "{name}"')
    finally:
        await admin.close()


def _upgrade(connection: Connection) -> None:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    config.attributes["connection"] = connection
    command.upgrade(config, "head")


@pytest.fixture(scope="session")
async def engine(database_url: str) -> AsyncIterator[AsyncEngine]:
    await _ensure_database(database_url)
    engine = create_async_engine(database_url)
    async with engine.begin() as connection:
        await connection.execute(text("DROP SCHEMA public CASCADE"))
        await connection.execute(text("CREATE SCHEMA public"))
        await connection.run_sync(_upgrade)
    yield engine
    await engine.dispose()


@pytest.fixture
async def session(engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(
            bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
        )
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()


@pytest.fixture
def app(session: AsyncSession) -> FastAPI:
    app = create_app()

    async def _session() -> AsyncIterator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = _session
    return app


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
def act_as(app: FastAPI) -> Callable[[str], None]:
    """Switch the caller: `act_as("user-b")`."""

    def switch(sub: str) -> None:
        app.dependency_overrides[get_principal] = lambda: Principal(sub=sub)

    return switch
