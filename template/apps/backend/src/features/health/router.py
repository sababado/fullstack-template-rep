"""Liveness check. Public (no authorizer) and never touches the database, so
it stays green during a database outage and costs nothing to call."""

from typing import Literal

from fastapi import APIRouter

from core.config import get_settings
from core.schemas import BaseSchema

router = APIRouter(tags=["health"])


class HealthResponse(BaseSchema):
    status: Literal["ok"]
    version: str


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    return HealthResponse(status="ok", version=get_settings().app_version)
