/**
 * Must match the backend (core/schemas/validators.py). A test checks these
 * against apps/backend/openapi.json so the two can't drift apart.
 */
export const NOTE_LIMITS = { title: 200, body: 5000 } as const;
