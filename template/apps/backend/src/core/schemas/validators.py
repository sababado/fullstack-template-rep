"""Length limits and string types shared by schemas, models, and migrations.

Use the same constant in the schema (validation), the model column
(VARCHAR length), and the frontend input (maxLength) so the layers agree.
"""

import html
from typing import Annotated

import nh3
from pydantic import AfterValidator, StringConstraints

MAX_SHORT_STRING = 200
MAX_MEDIUM_STRING = 1_000
MAX_LONG_STRING = 5_000


def sanitize_html(value: str) -> str:
    """Strip every HTML tag, including ones hidden behind entity encoding.

    Decodes entities and re-cleans until the text stops changing, so input
    like `&lt;script&gt;` can't come back as a live tag after a later decode.
    """
    previous = None
    current = value
    while current != previous:
        previous = current
        current = html.unescape(nh3.clean(current, tags=set()))
    return current.strip()


def _require_text(value: str) -> str:
    if not value:
        raise ValueError("Enter at least one visible character.")
    return value


# Length is checked on the raw input, then tags are stripped. Required text is
# checked for emptiness after stripping, so "<b></b>" doesn't count as a value.
PlainText = Annotated[str, AfterValidator(sanitize_html)]

ShortString = Annotated[
    str,
    StringConstraints(max_length=MAX_SHORT_STRING),
    AfterValidator(sanitize_html),
    AfterValidator(_require_text),
]
MediumString = Annotated[str, StringConstraints(max_length=MAX_MEDIUM_STRING), AfterValidator(sanitize_html)]
LongString = Annotated[str, StringConstraints(max_length=MAX_LONG_STRING), AfterValidator(sanitize_html)]
