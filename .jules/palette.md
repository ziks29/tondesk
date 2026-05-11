## 2024-05-24 - Accessible Custom Switches and Collapsibles
**Learning:** Custom switch components and collapsibles frequently lack native accessibility features, making them opaque to screen readers.
**Action:** Always add `role="switch"` with `aria-checked` to custom toggles, and `aria-expanded` with `aria-controls` (pointing to a unique ID) for collapsible sections.
