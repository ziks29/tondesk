## 2024-05-20 - Custom Switch Accessibility
**Learning:** Custom toggle buttons implemented with `<div>` or `<button>` and CSS transitions are not announced correctly by screen readers as togglable states by default.
**Action:** Always add `role="switch"` and dynamically manage `aria-checked={boolean}` on custom toggle elements to ensure they are announced correctly to assistive technologies.
