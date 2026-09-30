from collections.abc import AsyncGenerator, Iterator
from types import TracebackType
from typing import cast

import pytest

from core import database
from core.config import Settings


@pytest.fixture(autouse=True)
def reset_engine() -> Iterator[None]:
    yield
    database._engine = None
    database._sessionmaker = None


def test_aws_engine_connects_through_the_secret() -> None:
    settings = Settings(
        app_env="dev",
        auth_mode="jwt",
        database_url=None,
        db_host="db.internal",
        db_name="app",
        db_secret_arn="arn:aws:secretsmanager:us-east-1:123456789012:secret:db",
    )

    engine = database.create_engine_from_settings(settings)

    # No connection is opened until first use; the URL carries no credentials.
    assert engine.url.drivername == "postgresql+asyncpg"
    assert engine.url.password is None


class FakeSession:
    def __init__(self) -> None:
        self.committed = False
        self.rolled_back = False

    async def __aenter__(self) -> FakeSession:
        return self

    async def __aexit__(
        self, exc_type: type[BaseException] | None, exc: BaseException | None, tb: TracebackType | None
    ) -> None:
        return None

    async def commit(self) -> None:
        self.committed = True

    async def rollback(self) -> None:
        self.rolled_back = True


@pytest.fixture
def fake_session(monkeypatch: pytest.MonkeyPatch) -> FakeSession:
    session = FakeSession()
    monkeypatch.setattr(database, "get_sessionmaker", lambda: lambda: session)
    return session


async def test_session_commits_when_the_handler_succeeds(fake_session: FakeSession) -> None:
    dependency = database.get_session()
    await anext(dependency)
    with pytest.raises(StopAsyncIteration):
        await anext(dependency)

    assert fake_session.committed
    assert not fake_session.rolled_back


async def test_session_rolls_back_when_the_handler_raises(fake_session: FakeSession) -> None:
    dependency = cast(AsyncGenerator[object], database.get_session())
    await anext(dependency)
    with pytest.raises(ValueError, match="boom"):
        await dependency.athrow(ValueError("boom"))

    assert fake_session.rolled_back
    assert not fake_session.committed


async def test_engine_is_created_lazily_and_disposed() -> None:
    engine = database.get_engine()

    assert database.get_engine() is engine
    assert database.get_sessionmaker() is database.get_sessionmaker()
    await database.dispose_engine()
    assert database._engine is None
