"""Test settings. Set before any app module is imported."""

import os

os.environ["APP_ENV"] = "test"
os.environ["AUTH_MODE"] = "local"
os.environ["APP_VERSION"] = "test"
# Unit tests never connect; integration tests override the session dependency
# with a connection to the test database (see tests/integration/conftest.py).
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://unused:unused@localhost:1/unused")
