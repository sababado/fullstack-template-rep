# Frontend Security

Please refer to the [Root Security Guide](../../../docs/SECURITY.md) for overarching security principles.

## Specifics for Frontend

1. **Input Sanitization:** Use utility functions to strip harmful scripts from user input.
2. **Validation Hook:** Use useFormValidation for all forms.
3. **Dependencies:** Regularly audit npm packages for vulnerabilities.
