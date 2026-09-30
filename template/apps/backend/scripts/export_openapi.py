"""Write the API contract to apps/backend/openapi.json.

The frontend generates its API types from this file (npm run gen:api), and CI
fails if the committed copy is out of date.
"""

import json
import os
import sys
from pathlib import Path

# The contract doesn't depend on a database; satisfy settings validation.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://unused/unused")
os.environ.setdefault("APP_ENV", "local")
os.environ.setdefault("APP_VERSION", "contract")

from app import create_app

OUTPUT = Path(__file__).resolve().parent.parent / "openapi.json"


def main() -> None:
    schema = create_app().openapi()
    OUTPUT.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n")
    sys.stdout.write(f"Wrote {OUTPUT}\n")


if __name__ == "__main__":
    main()
