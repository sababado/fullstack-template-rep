# Accessibility Guide 

The UI Kit is built with accessibility as a core principle. This guide explains how to use the provided features.

## 1. Skip Links (Keyboard Navigation)

A "Skip to Content" link allows keyboard users to bypass navigation menus.

## 2. Dark Mode & High Contrast

The UI Kit uses semantic tokens to ensure sufficient color contrast in both Light and Dark modes.

### How to Use
- **Never hardcode colors** (e.g., bg-gray-900).
- **Always use semantic tokens** (e.g., bg-surface-page, text-primary).

## 3. Keyboard Navigation

All interactive components include visible focus indicators.

### Best Practices
- **Focus Rings:** Do not remove default focus rings (outline-none).
- **Interactive Elements:** Use <button> or <a> for clickable elements.

## 4. ARIA Labels

Components accept aria-label for cases where the text content is not descriptive enough.

## 5. Testing

We recommend testing your application with:
1.  **Keyboard navigation**
2.  **Screen Readers** (NVDA/VoiceOver)
3.  **Contrast Lookups** (Lighthouse)
