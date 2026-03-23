## 2024-05-16 - Form Accessibility
**Learning:** Next.js applications require explicit linking of labels and inputs for screen readers, and icon-only buttons need `aria-label` attributes for context.
**Action:** Ensure all forms use `htmlFor` and `id` attributes to link labels and inputs, and add `aria-label` to all icon-only buttons.