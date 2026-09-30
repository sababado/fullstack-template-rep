"""Feature packages. Each subpackage is one vertical slice: router, schemas,
service, models, errors. Features don't import each other (see the
import-linter contracts in pyproject.toml)."""

import importlib
import importlib.util
import pkgutil


def import_all_models() -> list[str]:
    """Import every feature's models so Base.metadata knows every table.

    Alembic (migrations/env.py) and the test suite call this, so adding a
    feature with a models.py needs no registration step.
    """
    imported = []
    for feature in pkgutil.iter_modules(__path__):
        name = f"{__name__}.{feature.name}.models"
        if feature.ispkg and importlib.util.find_spec(name) is not None:
            importlib.import_module(name)
            imported.append(name)
    return imported
