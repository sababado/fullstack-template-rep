# Security Architecture

> [!IMPORTANT]
> This document outlines the security validation infrastructure. All developers must follow these guidelines.

---

## Overview

We implement a **defense-in-depth** security strategy:

1. **Frontend** - Client-side validation for UX
2. **Backend (Pydantic)** - Application-level validation
3. **Database** - Schema-level constraints
4. **ORM** - SQL injection prevention

---

## Validation Infrastructure

### Backend: Pydantic Schemas

All API request/response schemas should inherit from a BaseSchema that provides automatic security features like whitespace trimming.

### Reusable Validators

Centralized validation constants ensure consistency (e.g., MAX_SHORT_STRING = 100).

---

## Frontend Validation

### Sanitization

Client-side sanitization prevents common XSS attacks before they reach availability.

### Validation Hook

Use a reusable useFormValidation hook to match backend rules.

---

## Attack Prevention

| Attack Vector | Defense Layer | Implementation |
|---------------|---------------|----------------|
| **SQL Injection** | ORM | Parameterized queries |
| **XSS** | Backend | Sanitization utility |
| **Length Overflow** | Backend | Max length field validation |
| **Invalid Enums** | Backend | Enum validation |

---

## Checklist for New Features

- [ ] Schema inherits from BaseSchema
- [ ] Use type aliases (ShortString, etc.)
- [ ] Apply sanitization to user-input text fields
- [ ] Use enums for status fields
- [ ] Add security tests
