## 2024-05-24 - Custom Toggle Button Accessibility
**Learning:** Custom toggle buttons built with `div`/`span` styling inside a `<button>` tag lack inherent switch semantics, making them opaque to screen reader users regarding their current toggled state.
**Action:** Ensure all custom toggle switches in the project utilize the `role="switch"` attribute, an accurate `aria-checked={boolean}` state, and a descriptive `aria-label`.
