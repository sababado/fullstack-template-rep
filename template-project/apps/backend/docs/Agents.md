# AI Agent Context: Backend

This document outlines the standards and architecture for the **Backend Application** (apps/backend).

## 1. Tech Stack
*   **Language:** Python 3.11+.
*   **Framework:** FastAPI.
*   **Database:** PostgreSQL + SQLModel (ORM) + Alembic (Migrations).
*   **Infrastructure:** AWS SAM (Serverless Application Model).

## 2. API First Design Philosophy

We strictly follow an **API First** methodology.

1.  **Contract Definitions:** API Contracts (Pydantic Schemas) are defined *before* business logic.
2.  **Single Source of Truth:** The FastAPI auto-generated OpenAPI.json is the source of truth for the frontend.
3.  **Strict IO:** All endpoints must have explicit response_model and input Pydantic models. NO dict or untyped returns.
4.  **Mocking:** Schemas allow the frontend to develop against mocks before the backend is fully implemented.

## 3. Architecture Layout
*   routers/: API Endpoints (The Interface).
*   models/: Database Models (The Storage).
*   schemas/: Pydantic Models (The Contract).
*   functions/: Lambda handlers.

## 4. Key Modules
*   **Async First:** Use async def for I/O.
*   **Type Safety:** Strict Pydantic models.
*   **Migrations:** Always use Alembic.

## 5. Documentation Standards
*   **Location:** ALL documentation must be saved in apps/backend/docs/.
