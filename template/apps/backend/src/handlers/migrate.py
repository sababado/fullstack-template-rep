"""Lambda that applies Alembic migrations. The deploy workflow invokes it after
`sam deploy` and fails the deploy if the response contains "errorMessage"."""

from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config

from core.logging import logger

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


def _alembic_config() -> Config:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    return config


@logger.inject_lambda_context(clear_state=True)
def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    target = str(event.get("target", "head"))
    logger.info("Applying migrations", extra={"target": target})
    command.upgrade(_alembic_config(), target)
    logger.info("Migrations applied", extra={"target": target})
    return {"status": "ok", "target": target}
