import uuid
from datetime import datetime

from core.schemas import BaseSchema, LongString, ShortString


class NoteCreate(BaseSchema):
    title: ShortString
    body: LongString = ""


class NoteUpdate(BaseSchema):
    title: ShortString | None = None
    body: LongString | None = None


class NoteRead(BaseSchema):
    id: uuid.UUID
    title: str
    body: str
    created_at: datetime
    updated_at: datetime


class NoteList(BaseSchema):
    items: list[NoteRead]
