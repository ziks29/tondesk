## 2025-04-25 - ARIA Toggles and Labels

**Learning:** This app heavily uses collapsible "Advanced Settings" sections and toggle switches (web search) without proper accessibility attributes. Screen readers would not know the state of the collapsible section or that the toggles act as switches. Icon-only buttons (Trash/Delete, Close/X) are missing ARIA labels.

**Action:** Add `aria-expanded`, `aria-controls`, `role="switch"`, `aria-checked` and `aria-label` to these interactive elements to follow the established memory directives for accessibility.
