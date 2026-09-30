from typing import Any

import pytest
from starlette.requests import Request

from core import auth
from core.auth import LOCAL_PRINCIPAL, Principal, get_principal, principal_from_claims, require_group
from core.config import get_settings
from core.errors import ForbiddenError, UnauthorizedError


def _request(event: dict[str, Any] | None) -> Request:
    scope: dict[str, Any] = {"type": "http", "method": "GET", "path": "/", "headers": []}
    if event is not None:
        scope["aws.event"] = event
    return Request(scope)


def test_principal_from_http_api_claims() -> None:
    principal = principal_from_claims(
        {"sub": "abc-123", "username": "ada", "cognito:groups": "[admin editors]"}
    )

    assert principal.sub == "abc-123"
    assert principal.username == "ada"
    assert principal.groups == frozenset({"admin", "editors"})


def test_missing_claims_are_unauthorized() -> None:
    with pytest.raises(UnauthorizedError):
        principal_from_claims(None)
    with pytest.raises(UnauthorizedError):
        principal_from_claims({"username": "no-sub"})


def test_local_mode_uses_the_local_principal() -> None:
    assert get_principal(_request(None)) == LOCAL_PRINCIPAL


def test_jwt_mode_reads_authorizer_claims(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "get_settings", lambda: get_settings().model_copy(update={"auth_mode": "jwt"}))
    event = {"requestContext": {"authorizer": {"jwt": {"claims": {"sub": "user-1"}}}}}

    assert get_principal(_request(event)).sub == "user-1"
    with pytest.raises(UnauthorizedError):
        get_principal(_request({}))


def test_require_group() -> None:
    check = require_group("admin").dependency

    assert check(Principal(sub="a", groups=frozenset({"admin"}))).sub == "a"
    with pytest.raises(ForbiddenError):
        check(Principal(sub="b"))
