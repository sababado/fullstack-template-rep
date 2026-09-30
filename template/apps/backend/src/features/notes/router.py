import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import CurrentPrincipal
from core.database import get_session
from core.errors import ERROR_RESPONSES
from features.notes import service
from features.notes.schemas import NoteCreate, NoteList, NoteRead, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"], responses=ERROR_RESPONSES)
Session = Annotated[AsyncSession, Depends(get_session)]


@router.get("", response_model=NoteList)
async def list_notes(
    principal: CurrentPrincipal,
    session: Session,
    limit: Annotated[int, Query(ge=1, le=service.MAX_PAGE_SIZE)] = 50,
) -> NoteList:
    notes = await service.list_notes(session, principal.sub, limit)
    return NoteList(items=[NoteRead.model_validate(note) for note in notes])


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(body: NoteCreate, principal: CurrentPrincipal, session: Session) -> NoteRead:
    return NoteRead.model_validate(await service.create_note(session, principal.sub, body))


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(note_id: uuid.UUID, principal: CurrentPrincipal, session: Session) -> NoteRead:
    return NoteRead.model_validate(await service.get_note(session, principal.sub, note_id))


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: uuid.UUID, body: NoteUpdate, principal: CurrentPrincipal, session: Session
) -> NoteRead:
    return NoteRead.model_validate(await service.update_note(session, principal.sub, note_id, body))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: uuid.UUID, principal: CurrentPrincipal, session: Session) -> None:
    await service.delete_note(session, principal.sub, note_id)
