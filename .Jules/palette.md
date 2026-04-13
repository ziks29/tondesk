## 2024-05-18 - Accessibility for icon-only buttons
**Learning:** Icon-only buttons using SVG components need explicit ARIA labels and title attributes on the button element, while the SVG itself should have `aria-hidden="true"` to prevent screen readers from reading confusing paths. Furthermore, custom toggle buttons built with divs/spans need `role="switch"` and `aria-checked={boolean}` to be properly recognized by screen readers.
**Action:** When adding or reviewing icon-only buttons and custom switches, ensure they have proper ARIA attributes to improve accessibility.
