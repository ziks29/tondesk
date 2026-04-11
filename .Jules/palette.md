## 2024-05-15 - Missing ARIA labels on dynamic list item actions
**Learning:** Found a recurring pattern where dynamically rendered list items (like URLs or uploaded files) use icon-only buttons (e.g., `Trash2` or `X` from lucide-react) for removal actions. These buttons lack screen-reader context.
**Action:** Always verify that mapped list item components have `aria-label` and `title` on their action buttons, and that the SVG icons inside them are marked with `aria-hidden="true"`.
