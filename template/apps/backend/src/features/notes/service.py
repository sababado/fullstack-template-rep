"""Notes business logic. Every query is scoped to the caller's `owner_sub`:
a note that belongs to someone else is reported as not found, never forbidden,
so its existence isn't leaked."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from features.notes.errors import NoteNotFoundError
from features.notes.models import Note
from features.notes.schemas import NoteCreate, NoteUpdate

MAX_PAGE_SIZE = 100


async def list_notes(session: AsyncSession, owner_sub: str, limit: int = 50) -> list[Note]:
    statement = (
        select(Note)
        .where(Note.owner_sub == owner_sub)
        .order_by(Note.created_at.desc(), Note.id.desc())
        .limit(min(limit, MAX_PAGE_SIZE))
    )
    return list((await session.execute(statement)).scalars())


async def get_note(session: AsyncSession, owner_sub: str, note_id: uuid.UUID) -> Note:
    note = await session.get(Note, note_id)
    if note is None or note.owner_sub != owner_sub:
        raise NoteNotFoundError()
    return note


async def create_note(session: AsyncSession, owner_sub: str, data: NoteCreate) -> Note:
    note = Note(owner_sub=owner_sub, **data.model_dump())
    session.add(note)
    await session.flush()
    logger.info("Note created", extra={"note_id": str(note.id)})
    return note


async def update_note(session: AsyncSession, owner_sub: str, note_id: uuid.UUID, data: NoteUpdate) -> Note:
    note = await get_note(session, owner_sub, note_id)
    for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(note, key, value)
    await session.flush()
    await session.refresh(note)
    return note


async def delete_note(session: AsyncSession, owner_sub: str, note_id: uuid.UUID) -> None:
    note = await get_note(session, owner_sub, note_id)
    await session.delete(note)
    await session.flush()
    logger.info("Note deleted", extra={"note_id": str(note_id)})
