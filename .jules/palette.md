## 2024-05-30 - Custom Switch Accessibility
**Learning:** Custom toggle buttons (switches) used in advanced settings require specific ARIA roles to be properly identified by screen readers, avoiding generic button interpretation.
**Action:** Always implement `role="switch"` and `aria-checked={boolean}` alongside a descriptive `aria-label` when creating custom toggle switches in the UI.
