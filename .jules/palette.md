## 2024-05-24 - Accessible Toggles and Collapsibles
**Learning:** Custom UI controls like switches (toggles) and collapsibles (accordions) visually indicate state, but often lack ARIA attributes, leaving them invisible or confusing to assistive technologies.
**Action:** Always ensure custom switches have `role="switch"`, `aria-checked`, and `aria-label`. Always ensure collapsible buttons have `aria-expanded` and an `aria-controls` referencing a unique `id` on the expandable container, especially appending identifiers like `${botId}` when rendered in lists to prevent duplicate IDs.
