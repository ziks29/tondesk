## 2024-06-03 - Accessible Toggle Switches
**Learning:** Custom toggle buttons (switches) created with standard `<button>` elements lack native semantic meaning for screen readers, meaning users won't know it's a switch or its current state.
**Action:** Always implement custom toggle buttons with `role="switch"`, `aria-checked={boolean}`, and a descriptive `aria-label` to ensure proper screen reader compatibility and announce their state dynamically.
