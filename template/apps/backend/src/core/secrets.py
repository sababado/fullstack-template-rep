"""Secrets Manager reads with a short cache.

Values are re-read after the TTL, so a rotated secret is picked up without a
redeploy. The boto3 client is created lazily: nothing touches the network at
import time, which keeps Lambda SnapStart snapshots free of open sockets.
"""

import json
import time
from functools import cache
from typing import TYPE_CHECKING, Any

import boto3

if TYPE_CHECKING:
    from mypy_boto3_secretsmanager import SecretsManagerClient

_cache: dict[str, tuple[float, dict[str, Any]]] = {}


@cache
def _client() -> SecretsManagerClient:
    return boto3.client("secretsmanager")


def get_secret_json(secret_id: str, ttl_seconds: int) -> dict[str, Any]:
    cached = _cache.get(secret_id)
    if cached and time.monotonic() - cached[0] < ttl_seconds:
        return cached[1]
    value: dict[str, Any] = json.loads(_client().get_secret_value(SecretId=secret_id)["SecretString"])
    _cache[secret_id] = (time.monotonic(), value)
    return value


def clear_secret_cache() -> None:
    _cache.clear()
