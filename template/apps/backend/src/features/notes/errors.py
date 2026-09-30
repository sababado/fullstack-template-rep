from core.errors import NotFoundError


class NoteNotFoundError(NotFoundError):
    code = "NOTE_NOT_FOUND"
    message = "Note not found."
