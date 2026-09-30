# Feature map

Where each feature lives in every layer. Add a row when you add a feature, and update
it when you rename or remove one.

| Feature | Backend (`apps/backend/src/features/`) | Frontend (`apps/frontend/src/features/`) | UI kit components | Notes |
| --- | --- | --- | --- | --- |
| Health | `health/` | none (used by the deploy check) | none | Public, no database |
| Notes | `notes/` | `notes/` | Card, FormField, EmptyState, Alert | Worked example: per-user CRUD. Replace or delete it. |

## Known misalignments

Record naming or placement splits here instead of leaving them undocumented.

- None yet.
