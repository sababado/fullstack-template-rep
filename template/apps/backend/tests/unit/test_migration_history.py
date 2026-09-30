"""Two branches that each add a migration produce two heads; merge them first."""

from alembic.config import Config
from alembic.script import ScriptDirectory

from handlers.migrate import MIGRATIONS_DIR


def test_migrations_have_a_single_head() -> None:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    heads = ScriptDirectory.from_config(config).get_heads()

    assert len(heads) == 1, f"Multiple migration heads {heads}: run `alembic merge heads`."
