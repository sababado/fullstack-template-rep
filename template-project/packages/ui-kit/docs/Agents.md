# AI Agent Context: UI Kit

This document is the **primary source of truth** for the component library. It focuses on component library standards, atomic design, and refactoring protocols.

## 1. Objective

Refactor monolithic prototypes into a clean, maintainable, and atomic **React Component Library** that serves as the design system for the project.

## 2. Tech Stack

* **Framework:** React (Functional Components, Hooks).
* **Language:** TypeScript (Strict Mode). Interfaces over Types.
* **Styling:** Tailwind CSS (Utility-first).
* **Icons:** lucide-react.
* **Base:** shadcn/ui (Radix UI primitives).

## 3. Atomic Design Structure

We follow a modified Atomic Design structure within src/design-system/:

* **atoms/:** Base primitives (e.g., Button).
* **molecules/:** Domain-specific composites (e.g., StatCard).
* **organisms/:** Complex sections (e.g., StatsGrid).

## 4. Refactoring Rules for AI Agents

### Extraction Protocol

1. **Identify:** Locate the pattern.
2. **Move:** Place in atoms, molecules, or organisms.
3. **Interface:** Create a named interface for props. **No any**.
4. **Decouple:** Remove hardcoded data. Pass data via props.

## 5. Testing Standards

* **Tool:** Vitest + React Testing Library.
* **Requirement:** 100% coverage for Atoms, >80% for Molecules/Organisms.
* **Storybook:** Every component must have a corresponding .stories.tsx file.

## 6. Internationalization

* **Tool:** react-i18next.
* **Requirement:** All text must be translatable.

## 7. Accessibility

* **Accessibility:** Ensure all components are accessible (ARIA attributes, keyboard navigation).

## 8. Contributing

This guide focuses on contributing to the component library.

###  Development Workflow

We use **Atomic Design** principles to organize our components.

#### Directory Structure

`
src/design-system/
 atoms/       # Basic building blocks (Button, Badge)
 molecules/   # Simple combinations (StatCard, SearchInput)
 organisms/   # Complex sections (StatsGrid, BookingCalendar)
 templates/   # Page layouts (DashboardLayout)
 tokens.ts    # Design tokens (colors, spacing)
`

#### Style Guide

- **Naming:** PascalCase for components (MyComponent.tsx).
- **CSS:** Tailwind CSS. Use tokens instead of arbitrary values.
- **Icons:** Use lucide-react.
