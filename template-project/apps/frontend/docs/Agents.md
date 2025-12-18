# AI Agent Context: Frontend

This document outlines the standards and architecture for the **Frontend Application** (apps/frontend).

## 1. Tech Stack

* **Framework:** React 19 (Functional Components, Hooks).
* **Build Tool:** Vite.
* **Language:** TypeScript (Strict Mode).
* **Styling:** Tailwind CSS (via UI Kit tokens).
* **Component Library:** @/packages/ui-kit (Local Workspace).
* **Icons:** lucide-react.

## 2. Architecture & File Structure

`
apps/frontend/src/
 assets/            # Static assets
 components/        # App-specific components
 layouts/           # Page layouts
 pages/             # Route components
 hooks/             # App-specific hooks
 utils/             # Utilities
 App.tsx            # Main application entry
 main.tsx           # React root
`

## 3. Using the UI Kit

* **Import Rule:** ALWAYS import components from the shared UI Kit package.
* **Design Tokens:** Inherit Tailwind usage from the UI Kit system.

## 4. State Management

* **Local State:** useState, useReducer.
* **Global State:** Context API or external libraries as needed.
* **Data Fetching:** Custom Hooks over inline useEffect.

## 5. Documentation Standards
* **Location:** ALL documentation must be saved in apps/frontend/docs/.

## 6. Contributing

For all contributing guidelines, architecture overview, and technical standards, please refer to:

 **[Agents.md](Agents.md)**

This document serves as the single source of truth for:
- Tech Stack & Architecture
- Code Standards & Best Practices
- Testing & Verification
