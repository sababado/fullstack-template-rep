"""Who is calling.

In AWS, API Gateway's JWT authorizer verifies the Cognito access token before
the request reaches Lambda; this module only reads the verified claims that
Mangum passes through in the ASGI scope. Locally (AUTH_MODE=local) every
request acts as one fixed user, which config.py refuses outside local/test.
"""

from dataclasses import dataclass, field
from typing import Annotated, Any

from fastapi import Depends, Request

from core.config import get_settings
from core.errors import ForbiddenError, UnauthorizedError


@dataclass(frozen=True, slots=True)
class Principal:
    sub: str
    username: str | None = None
    groups: frozenset[str] = field(default_factory=frozenset)


LOCAL_PRINCIPAL = Principal(sub="local-user", username="local-dev", groups=frozenset({"admin"}))


def _parse_groups(raw: Any) -> frozenset[str]:
    # HTTP API passes list claims as a string like "[admin editors]".
    if isinstance(raw, list):
        return frozenset(str(item) for item in raw)
    if isinstance(raw, str):
        return frozenset(part for part in raw.strip("[]").replace(",", " ").split() if part)
    return frozenset()


def principal_from_claims(claims: dict[str, Any] | None) -> Principal:
    if not claims or not claims.get("sub"):
        raise UnauthorizedError()
    return Principal(
        sub=str(claims["sub"]),
        username=claims.get("username") or claims.get("cognito:username"),
        groups=_parse_groups(claims.get("cognito:groups")),
    )


def get_principal(request: Request) -> Principal:
    if get_settings().auth_mode == "local":
        return LOCAL_PRINCIPAL
    event = request.scope.get("aws.event") or {}
    claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims")
    return principal_from_claims(claims)


CurrentPrincipal = Annotated[Principal, Depends(get_principal)]


def require_group(group: str) -> Any:
    """Dependency factory: `dependencies=[require_group("admin")]` on a route."""

    def check(principal: CurrentPrincipal) -> Principal:
        if group not in principal.groups:
            raise ForbiddenError()
        return principal

    return Depends(check)
