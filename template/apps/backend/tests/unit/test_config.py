import pytest
from pydantic import ValidationError

from core.config import Settings


def test_local_auth_is_refused_in_deployed_environments() -> None:
    with pytest.raises(ValidationError, match="AUTH_MODE=local"):
        Settings(app_env="prod", auth_mode="local", database_url="postgresql+asyncpg://x/y")


def test_aws_database_settings_require_the_secret() -> None:
    with pytest.raises(ValidationError, match="DB_SECRET_ARN"):
        Settings(app_env="dev", auth_mode="jwt", database_url=None, db_host="db", db_name="app")


def test_aws_database_settings() -> None:
    settings = Settings(
        app_env="dev",
        auth_mode="jwt",
        database_url=None,
        db_host="db.internal",
        db_name="app",
        db_secret_arn="arn:aws:secretsmanager:us-east-1:123456789012:secret:db",
    )
    assert settings.is_deployed
