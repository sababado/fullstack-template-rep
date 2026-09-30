import pytest
from pydantic import ValidationError

from core.schemas import BaseSchema, LongString, ShortString, sanitize_html
from core.schemas.validators import MAX_SHORT_STRING


class Example(BaseSchema):
    title: ShortString
    body: LongString = ""


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("plain text", "plain text"),
        ("<b>bold</b> move", "bold move"),
        ("<script>alert(1)</script>after", "after"),
        ("&lt;script&gt;alert(1)&lt;/script&gt;after", "after"),
        ("&amp;lt;img src=x onerror=alert(1)&amp;gt;", ""),
        ("Tom & Jerry < Spike", "Tom & Jerry < Spike"),
        ("  padded  ", "padded"),
    ],
)
def test_sanitize_html(raw: str, expected: str) -> None:
    assert sanitize_html(raw) == expected


def test_short_string_rejects_markup_only_values() -> None:
    with pytest.raises(ValidationError, match="visible character"):
        Example(title="<b></b>")


def test_short_string_enforces_max_length() -> None:
    with pytest.raises(ValidationError, match="at most"):
        Example(title="x" * (MAX_SHORT_STRING + 1))


def test_base_schema_trims_and_rejects_unknown_fields() -> None:
    assert Example(title="  Hello  ").title == "Hello"
    with pytest.raises(ValidationError, match="Extra inputs"):
        Example.model_validate({"title": "Hello", "surprise": 1})
