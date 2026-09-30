"""Migrations and models must agree: the same check as `alembic check`."""

from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from sqlalchemy import Connection
from sqlalchemy.ext.asyncio import AsyncEngine

from core.models import Base
from features import import_all_models


def _diff(connection: Connection) -> list[object]:
    import_all_models()
    context = MigrationContext.configure(
        connection, opts={"compare_type": True, "compare_server_default": True}
    )
    return list(compare_metadata(context, Base.metadata))


async def test_models_match_migrations(engine: AsyncEngine) -> None:
    async with engine.connect() as connection:
        diff = await connection.run_sync(_diff)

    assert diff == [], f"Models and migrations differ; generate a migration. Diff: {diff}"
