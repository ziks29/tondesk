
## 2024-05-18 - Accessibility Attributes for Collapsibles and Switches
**Learning:** Custom UI components like collapsibles and toggle switches require specific ARIA roles (`role="switch"`) and states (`aria-expanded`, `aria-checked`, `aria-controls`) to be properly understood by screen readers, and HTML `id` attributes must be uniquely scoped (e.g., appending a `botId`) when rendered repeatedly in lists or editing panels to prevent invalid ARIA references.
**Action:** Always verify that interactive custom components have appropriate ARIA states and use dynamic identifier suffixes for any `id`/`aria-controls` bindings inside mapped components or repeating structures.
