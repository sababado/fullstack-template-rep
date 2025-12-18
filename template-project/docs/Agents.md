# AI Agent Context: [Project Name] (Root)

This document serves as the primary source of truth for AI agents operating at the **monorepo root level**. It outlines the high-level project scope, global architecture, and workspace structure.

## 1. Project Objective

**[Project Name]** is a [Brief Description of Project].

**Key Goals:**
* **[Goal 1]:** [Description]
* **[Goal 2]:** [Description]
* **[Goal 3]:** [Description]

## 2. Global Architecture

* **Monorepo Strategy:** NPM Workspaces for managing multiple packages.
* **Infrastructure:** "Serverless First" mentality (AWS Fargate, Lambda, S3/CloudFront).
* **Database:** PostgreSQL (Standard RDS) ensuring ACID compliance.

## 3. Workspace Structure

* **packages/ui-kit:** Shared React component library (Atomic Design).
* **apps/frontend:** Main web application (React/Vite).
* **apps/backend:** API and business logic (Python/FastAPI).

## 4. Core Features (The "What")

1. **[Feature 1]:** [Description]
2. **[Feature 2]:** [Description]
3. **[Feature 3]:** [Description]

## 5. Development Workflow

* **Package Linking:** Changes in packages/ui-kit are automatically reflected in apps/frontend via HMR.
* **Commands:**
  * `npm run dev`: Starts all frontend applications and Storybook.
  * `npm run lint`: Runs linting across all workspaces.

## 6. Implementation Plan Guidelines

When adding new features or making significant changes, always create a comprehensive **Implementation Plan**. This proactive step ensures clarity, quality, and maintainability.

**Plan Components:**

1.  **Phases & Checkpoints:**
    *   **Planning:** Define the scope, requirements, and design.
    *   **Implementation:** Executing code changes.
    *   **Verification:** Testing and validation.
    *   **Checkpoints:** Define stop/go criteria for each phase.

2.  **Testing & Verification:**
    *   Identify necessary Unit, Integration, and E2E tests.
    *   **Coverage:** Run tests with code coverage to ensure adequate testing of new logic.
    *   Plan for manual verification steps where automated tests aren't sufficient.

3.  **Code Commits:**
    *   Plan for atomic, focused commits.
    *   Follow the project's commit message conventions.

4.  **Documentation & Release Prep:**
    *   **Version Number:** Plan to update package.json version numbers according to semantic versioning.
    *   **Changelog:** Detailed entry in CHANGELOG.md summarizing the changes.
    *   **Readme & Docs:** Update README.md and create/update relevant documents in the docs/ folder.
        *   **Updates must include:** Latest test results, coverage metrics, and the new version number.
    *   **Production Readiness:** Ensure "Production Readiness" documents (e.g., deployment guides, env var requirements) in docs/ are created or updated.

## 7. Contributing

First off, thanks for taking the time to contribute! 

The following is a set of guidelines for contributing to [Project Name]. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

###  Getting Started

#### Prerequisites

- Node.js (v18+)
- npm (v9+)
- Python (v3.12+)

#### Installation

1. Clone the repository:
   ```bash
   git clone [Repo URL]
   ```
2. Install dependencies (root):
   ```bash
   npm install
   ```
3. Start the development server (runs both Frontend and Storybook):
   ```bash
   npm run dev
   ```

###  Development Workflow

#### Workspace-Specific Guides

Each part of the monorepo has its own detailed contribution guide:

- **[UI Kit Guide](../packages/ui-kit/docs/CONTRIBUTING.md):** Creating components, Atomic Design, Storybook.
- **[Frontend Guide](../apps/frontend/docs/CONTRIBUTING.md):** App architecture, using the UI Kit.
- **[Backend Guide](../apps/backend/docs/CONTRIBUTING.md):** Clean Architecture, Python standards.

#### Directory Structure

```
[Project Name]/
 packages/
    ui-kit/          # Component library (Atomic Design)
 apps/
    frontend/        # Main web application
    backend/         # API Service
 package.json         # Root configuration
```

###  Pull Request Process

1. Create a new branch from main.
2. Make your changes.
3. Run `npm run test` to ensure no regressions.
4. Run `npm run lint` to check for style issues.
5. Open a Pull Request.
6. Ensure CI checks pass.

###  License

By contributing, you agree that your contributions will be licensed under the project's license.
