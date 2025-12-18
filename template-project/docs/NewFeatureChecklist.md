# New Feature Checklist

This checklist is designed to ensure all new features adhere to project-wide standards, covering security, usability, and architecture.

##  Security & Access Control (RBAC)
- [ ] **RBAC Permissions**: Does this feature require new permissions?
    - [ ] Reuse existing permissions if possible.
    - [ ] If new permissions are needed, verify with the lead.
- [ ] **Role Updates**: Which roles should have access?
- [ ] **Authentication**: Does the feature require authentication?
    - [ ] Ensure API endpoints are protected.

##  Internationalization (i18n)
- [ ] **Translations**: Are all user-facing strings externalized?
    - [ ] Add keys to locale files (e.g., en.ts, es.ts).
    - [ ] Avoid hardcoded strings in components.

##  UI/UX & Design System
- [ ] **Design Tokens**: Are we using semantic colors and spacing?
    - [ ] Use bg-surface-card, text-primary, etc.
- [ ] **Components**: Are we using the UI Kit correctly?
- [ ] **Responsiveness**: Does it work on mobile/tablet?

## 6. Security & Validation Check

> [!CAUTION]
> All features that accept user input MUST pass security validation.

### Backend Security
- [ ] Schema inherits from BaseSchema
- [ ] Use centralized type aliases (ShortString, etc.)
- [ ] Applied sanitize_html() to user-input text fields
- [ ] Special fields (password, phone) have custom validators

### Frontend Security
- [ ] Used useFormValidation hook
- [ ] All text inputs have maxLength matching backend limits

##  Testing & Verification
- [ ] **Unit Tests**:
    - [ ] Backend: pytest for new logic/endpoints.
    - [ ] Frontend: vitest for components/hooks.
- [ ] **Integration/E2E**:
    - [ ] Does the feature flow work end-to-end?
- [ ] **Manual Verification**:
    - [ ] Verified locally?

##  Analytics & Logging
- [ ] **Logging**: Are errors logged with sufficient context?
- [ ] **Logging Standard**: Uses structured JSON logging.

---
*Copy this checklist into the PR description or a tracking issue for the new feature.*
