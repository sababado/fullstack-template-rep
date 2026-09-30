import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from core.models import Base, TimestampMixin
from core.schemas.validators import MAX_LONG_STRING, MAX_SHORT_STRING

MAX_OWNER_SUB = 64


class Note(TimestampMixin, Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid7)
    owner_sub: Mapped[str] = mapped_column(String(MAX_OWNER_SUB), index=True)
    title: Mapped[str] = mapped_column(String(MAX_SHORT_STRING))
    body: Mapped[str] = mapped_column(String(MAX_LONG_STRING), default="")
