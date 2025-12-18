import { Meta } from '@storybook/addon-docs';

<Meta title="Design System/Patterns/Validation" />

# Validation Patterns

We use a comprehensive security validation strategy that spans frontend, backend, and database layers.

## Principles

1.  **Defense in Depth**: Validation occurs at every layer.
2.  **Consistency**: Frontend rules must match backend constraints.
3.  **User Experience**: Immediate feedback on the client.

## Frontend Hook: useFormValidation

We provide a reusable hook useFormValidation to handle common validation scenarios.

## UI States

### Error Message
Validation errors should be displayed immediately below the input field using the error color token.

### Form Submission
Always run validateAll(formData) before sending data to the API.
