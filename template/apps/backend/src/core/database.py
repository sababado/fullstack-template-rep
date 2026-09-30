"""Async engine and per-request sessions.

Locally and in tests the engine uses DATABASE_URL. In AWS it connects with the
RDS-managed secret, fetched for each new connection (cached briefly), so
password rotation needs no redeploy.

The engine is created on first use, never at import time.
"""

import asyncio
from collections.abc import AsyncIterator
from typing import Any

import asyncpg
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from core.config import Settings, get_settings
from core.secrets import get_secret_json

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def create_engine_from_settings(settings: Settings | None = None, **kwargs: Any) -> AsyncEngine:
    settings = settings or get_settings()
    options: dict[str, Any] = {"pool_pre_ping": True, "pool_size": 2, "max_overflow": 2, "pool_recycle": 300}
    options.update(kwargs)
    if settings.database_url:
        return create_async_engine(settings.database_url, **options)

    secret_arn = settings.db_secret_arn
    if secret_arn is None:  # Settings validation guarantees this; keeps the type narrow.
        raise RuntimeError("DB_SECRET_ARN is required when DATABASE_URL isn't set.")

    async def connect() -> asyncpg.Connection:
        creds = await asyncio.to_thread(get_secret_json, secret_arn, settings.db_credentials_ttl_seconds)
        return await asyncpg.connect(
            host=settings.db_host,
            port=settings.db_port,
            database=settings.db_name,
            user=creds["username"],
            password=creds["password"],
            ssl="require",
        )

    return create_async_engine("postgresql+asyncpg://", async_creator=connect, **options)


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_engine_from_settings()
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _sessionmaker


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: one transaction per request.

    Commits when the handler returns, rolls back if it raises. Services call
    `session.flush()` when they need generated values, never `commit()`.
    """
    async with get_sessionmaker()() as session:
        try:
            yield session
            await session.commit()
        except BaseException:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    """Close pooled connections. Call at the end of every `asyncio.run()` in a
    non-API Lambda: asyncpg connections belong to the event loop that opened them."""
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None
