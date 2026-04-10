## 2024-05-24 - Added aria-label to icon-only buttons
**Learning:** Found multiple icon-only buttons (like Trash and X icons for deleting list items) in the bot deployment forms missing `aria-label` attributes. This is a common accessibility anti-pattern in forms with dynamic lists.
**Action:** When working with dynamically generated lists that include "remove" or "clear" actions using icons, always ensure an `aria-label` is applied to make the button's purpose clear to screen reader users.
