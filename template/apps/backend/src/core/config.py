"""Settings loaded from environment variables (and apps/backend/.env locally).

Every setting the API reads lives here, typed and validated once at startup.
"""

from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["local", "test", "dev", "staging", "prod"]
DEPLOYED_ENVS: frozenset[str] = frozenset({"dev", "staging", "prod"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: AppEnv = "local"
    app_version: str = "0.0.0-local"
    log_level: str = "INFO"

    # Local and test: a full SQLAlchemy URL (postgresql+asyncpg://...).
    database_url: str | None = None
    # AWS: host/port/name from the stack, credentials from the RDS-managed secret.
    db_host: str | None = None
    db_port: int = 5432
    db_name: str | None = None
    db_secret_arn: str | None = None
    db_credentials_ttl_seconds: int = Field(default=300, ge=0)

    # "jwt": trust the claims API Gateway's JWT authorizer already verified.
    # "local": every request acts as a fixed local user. Never allowed in AWS.
    auth_mode: Literal["jwt", "local"] = "jwt"

    @property
    def is_deployed(self) -> bool:
        return self.app_env in DEPLOYED_ENVS

    @model_validator(mode="after")
    def _check_consistency(self) -> Self:
        if self.auth_mode == "local" and self.is_deployed:
            raise ValueError("AUTH_MODE=local is only allowed when APP_ENV is local or test.")
        if not self.database_url and not (self.db_host and self.db_name and self.db_secret_arn):
            raise ValueError("Set DATABASE_URL, or DB_HOST, DB_NAME, and DB_SECRET_ARN.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
