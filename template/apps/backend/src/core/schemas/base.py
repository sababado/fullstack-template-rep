from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base for every request and response schema.

    - Trims surrounding whitespace from every string.
    - Rejects unknown fields, so typos in a request body fail loudly.
    - Reads attributes from ORM objects (`NoteRead.model_validate(note)`).
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
        from_attributes=True,
        validate_assignment=True,
    )
