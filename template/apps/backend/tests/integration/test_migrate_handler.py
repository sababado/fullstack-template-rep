from collections.abc import Iterator

import pytest

from core.config import get_settings
from handlers.migrate import handler


class LambdaContext:
    function_name = "migrate"
    memory_limit_in_mb = 512
    invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:migrate"
    aws_request_id = "req-migrate"


@pytest.fixture
def settings_for(database_url: str, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.usefixtures("engine", "settings_for")
def test_migrate_handler_upgrades_to_head() -> None:
    assert handler({}, LambdaContext()) == {"status": "ok", "target": "head"}
