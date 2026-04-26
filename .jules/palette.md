
## 2024-05-18 - Accessibility for Custom Icon Buttons and Switches
**Learning:** During UX review, I observed that lucide-react icon buttons (like `Trash2` or `X`) lack semantic meaning for screen readers, and custom `div`/`button` toggles for settings lack the proper switch role. This is a common pattern across Next.js components where visual layout precedes accessibility.
**Action:** Always add `aria-label` and `title` to icon-only buttons, and mark the internal SVG with `aria-hidden="true"`. For custom visual toggles, explicitly add `role="switch"` and dynamically set `aria-checked={boolean}` to properly represent state to assistive technologies.
