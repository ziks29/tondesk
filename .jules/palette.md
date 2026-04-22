
## 2024-05-18 - Playwright actionability checks for Custom Components
**Learning:** When interacting with custom UI components (like custom toggle switches or collapsible items) in Next.js/Tailwind using Playwright, standard actionability checks (like `.click()`) may fail with "element is outside of viewport" even if the element is visible.
**Action:** Use `.scroll_into_view_if_needed()` or `.click(force=True)` when verifying interactive custom elements via Playwright to bypass strict actionability bounds that might block verification.
