## 2024-04-27 - Add ARIA attributes to custom switch components
**Learning:** Custom toggle buttons implemented as simple `<button>` elements lack screen reader context, making it impossible for visually impaired users to know their state or purpose without `role="switch"` and `aria-checked`.
**Action:** Always verify custom interactive UI elements (like toggles and accordions) use semantic HTML or equivalent ARIA roles, states, and properties.
