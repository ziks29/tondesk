
## 2025-02-12 - Dynamic ARIA Controls in Lists
**Learning:** When using `aria-controls` for elements mapped inside a list or array, assigning static IDs creates duplicates and breaks accessibility linkages for screen readers.
**Action:** Always append a unique identifier (like an item ID) to the `id` of the controlled element and the `aria-controls` attribute of the trigger to ensure uniqueness and proper screen reader behavior.
