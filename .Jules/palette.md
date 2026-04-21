## 2025-01-20 - Custom Switch and Collapsible UI Accessibility
**Learning:** Custom UI elements acting as switches or collapsible toggles require specific ARIA attributes (`role="switch"`, `aria-checked`, and `aria-expanded`) to be properly recognized by screen readers, which is crucial for custom-built form elements in Next.js/React applications that don't use native HTML form controls.
**Action:** Always verify custom interactive elements (like toggle switches and expandable panels) have the correct semantic roles and state attributes.
