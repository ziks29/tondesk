## 2024-05-14 - Custom Toggle Switch Accessibility
**Learning:** Custom toggle switches built with `<button>` elements require specific ARIA roles to be fully accessible to screen readers, as the visual representation is not semantically understood.
**Action:** Always ensure custom switches include `role="switch"`, `aria-checked={boolean}`, and a descriptive `aria-label` or `aria-labelledby`.
