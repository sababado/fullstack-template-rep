"""Alembic environment (async).

Connection sources, in order:
1. `config.attributes["connection"]`: an open sync connection (tests pass one).
2. A new engine from core.config settings (CLI and the migrate Lambda).
"""

import asyncio

from alembic import context
from sqlalchemy.engine import Connection

from core.database import create_engine_from_settings
from core.models import Base
from features import import_all_models

import_all_models()
target_metadata = Base.metadata
config = context.config


def _configure(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def _run_with_new_engine() -> None:
    engine = create_engine_from_settings(pool_size=1, max_overflow=0)
    try:
        async with engine.connect() as connection:
            await connection.run_sync(_configure)
            await connection.commit()
    finally:
        await engine.dispose()


if context.is_offline_mode():
    raise SystemExit("Offline (--sql) migrations aren't supported; run against a database.")

existing = config.attributes.get("connection")
if existing is not None:
    _configure(existing)
else:
    asyncio.run(_run_with_new_engine())
