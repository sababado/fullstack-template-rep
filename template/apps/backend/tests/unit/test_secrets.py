import json
from collections.abc import Iterator
from typing import Any

import pytest

from core import secrets


class FakeSecretsClient:
    def __init__(self) -> None:
        self.calls = 0

    def get_secret_value(self, SecretId: str) -> dict[str, Any]:  # noqa: N803 (boto3's casing)
        self.calls += 1
        return {"SecretString": json.dumps({"username": "app", "password": f"pw-{self.calls}"})}


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[FakeSecretsClient]:
    fake = FakeSecretsClient()
    secrets.clear_secret_cache()
    monkeypatch.setattr(secrets, "_client", lambda: fake)
    yield fake
    secrets.clear_secret_cache()


def test_secret_is_cached_within_ttl(client: FakeSecretsClient) -> None:
    first = secrets.get_secret_json("arn:db", ttl_seconds=300)
    second = secrets.get_secret_json("arn:db", ttl_seconds=300)

    assert first == second == {"username": "app", "password": "pw-1"}
    assert client.calls == 1


def test_secret_is_reread_after_ttl(client: FakeSecretsClient) -> None:
    secrets.get_secret_json("arn:db", ttl_seconds=0)
    rotated = secrets.get_secret_json("arn:db", ttl_seconds=0)

    assert rotated["password"] == "pw-2"
