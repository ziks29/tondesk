## 2024-05-24 - Custom Toggle Button Accessibility
**Learning:** Custom switch buttons lacking `role="switch"` and `aria-checked` attributes are not recognized as toggles by screen readers, leading to poor accessibility for interactive settings. Also missing `aria-expanded` and `aria-controls` for expandable sections.
**Action:** Always add `role="switch"` and `aria-checked={boolean}` to custom toggle buttons to ensure proper screen reader compatibility. And add `aria-expanded` and `aria-controls` for expandable sections.
