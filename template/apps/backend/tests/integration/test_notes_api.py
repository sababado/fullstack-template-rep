from collections.abc import Callable

from httpx import AsyncClient


async def _create(client: AsyncClient, title: str = "Groceries", body: str = "Milk") -> dict[str, str]:
    response = await client.post("/notes", json={"title": title, "body": body})
    assert response.status_code == 201, response.text
    return dict(response.json())


async def test_create_and_list_notes(client: AsyncClient) -> None:
    created = await _create(client)

    response = await client.get("/notes")

    assert response.status_code == 200
    items = response.json()["items"]
    assert [item["id"] for item in items] == [created["id"]]
    assert items[0]["title"] == "Groceries"


async def test_create_strips_markup(client: AsyncClient) -> None:
    created = await _create(client, title="<b>Plan</b>", body="<script>alert(1)</script>Ship it")

    assert created["title"] == "Plan"
    assert created["body"] == "Ship it"


async def test_update_changes_only_sent_fields(client: AsyncClient) -> None:
    created = await _create(client)

    response = await client.patch(f"/notes/{created['id']}", json={"title": "Errands"})

    assert response.status_code == 200
    assert response.json()["title"] == "Errands"
    assert response.json()["body"] == "Milk"


async def test_delete_note(client: AsyncClient) -> None:
    created = await _create(client)

    assert (await client.delete(f"/notes/{created['id']}")).status_code == 204
    assert (await client.get(f"/notes/{created['id']}")).status_code == 404


async def test_other_users_notes_are_not_visible(client: AsyncClient, act_as: Callable[[str], None]) -> None:
    act_as("user-a")
    created = await _create(client)

    act_as("user-b")
    listing = await client.get("/notes")
    fetched = await client.get(f"/notes/{created['id']}")
    deleted = await client.delete(f"/notes/{created['id']}")

    assert listing.json()["items"] == []
    assert fetched.status_code == 404
    assert fetched.json()["error"]["code"] == "NOTE_NOT_FOUND"
    assert deleted.status_code == 404


async def test_validation_errors_use_the_error_envelope(client: AsyncClient) -> None:
    response = await client.post("/notes", json={"title": "", "unexpected": True})

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert {field["field"] for field in error["fields"]} == {"title", "unexpected"}
    assert error["request_id"]


async def test_list_limit_is_bounded(client: AsyncClient) -> None:
    response = await client.get("/notes", params={"limit": 1000})

    assert response.status_code == 422
    assert response.json()["error"]["fields"][0]["field"] == "limit"
