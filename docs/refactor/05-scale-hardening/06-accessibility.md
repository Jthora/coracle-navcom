# 05-06: Accessibility Remediation

> Bring NavCom to WCAG 2.1 Level AA compliance.

**Priority**: HIGH — required for institutional adoption and critical for users in high-stress situations (reduced dexterity, screen glare, fatigue).  
**Effort**: HIGH (touches many components)  
**Depends on**: 00-01 (design system fixes — color contrast must be resolved first), 01-03 through 01-07 (new UI components must be built accessible from the start)  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §7, [navcom-design-system.md](../../navcom-design-system.md) §Problem 12

---

## Problem

The current codebase has approximately 15 `aria-*` attributes total across the entire application. Key gaps:

- **No skip navigation** — keyboard-only users must tab through every element
- **No focus management** — modal open/close, route navigation, drawer transitions don't move focus
- **No live regions** — new messages, alerts, and status changes are invisible to screen readers
- **Color-only indicators** — encryption status, online/offline, unread counts rely solely on color
- **No reduced motion** — all animations play regardless of user preference
- **Touch targets** — many interactive elements are smaller than 44×44px minimum
- **No landmark roles** — no `<main>`, `<nav>`, `<aside>` semantic structure
- **Images without alt text** — user avatars, map tiles, uploaded photos

---

## Solution: Systematic WCAG 2.1 AA Remediation

### 1. Semantic HTML & Landmarks

```svelte
<!-- App.svelte layout structure -->
<a class="sr-only focus:not-sr-only" href="#main-content">Skip to content</a>
<nav aria-label="Mode navigation">
  <ModeTabBar />
</nav>
<aside aria-label="Channels">
  <ChannelSidebar />
</aside>
<main id="main-content" aria-label="Messages">
  <slot />
</main>
```

### 2. Focus Management

| Interaction | Focus behavior |
|-------------|---------------|
| Modal opens | Focus first focusable element inside modal |
| Modal closes | Return focus to trigger element |
| Route change | Focus `<main>` heading or first content |
| Drawer opens | Focus drawer header |
| New alert | Announce via `aria-live="assertive"` |
| New message | Announce via `aria-live="polite"` |

Implement a `trapFocus(node)` Svelte action for modals/drawers.

### 3. ARIA Live Regions

```svelte
<!-- Global announcer, placed once in App.svelte -->
<div aria-live="polite" aria-atomic="true" class="sr-only" bind:this={announcer}>
  {$announcement}
</div>
```

Route announcements through a centralized store:

```typescript
// src/partials/accessibility.ts
import {writable} from "svelte/store"
export const announcement = writable("")
export function announce(message: string) {
  announcement.set("")
  requestAnimationFrame(() => announcement.set(message))
}
```

### 4. Color Contrast & Non-Color Indicators

- Audit all text against WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- The cyan accent (`#22d3ee`) on dark backgrounds may fail — verify and adjust
- Add icons/text alongside color for: encryption tier, online status, unread markers
- Example: "🔒 Encrypted" not just a green dot

### 5. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Also check the map — tile transitions and marker animations should respect this preference.

### 6. Touch Target Sizing

Minimum 44×44px for all interactive elements. Common offenders:
- Icon-only buttons (close, back, menu items)
- Relay status dots
- Chip/tag elements that are clickable

### 7. Keyboard Navigation

- All interactive elements reachable via Tab
- Escape closes modals/drawers
- Arrow keys navigate within lists (channel list, message list)
- Enter/Space activates buttons
- No keyboard traps

---

## Priority Order

1. **Skip navigation + landmark roles** — quick wins, high impact
2. **Focus management for modals/drawers** — prevents keyboard traps
3. **ARIA live regions for messages/alerts** — core functionality for screen reader users
4. **Color contrast audit** — may require theme adjustments
5. **Reduced motion** — one CSS rule + map animation check
6. **Touch targets** — incremental sizing adjustments
7. **Keyboard navigation** — needs per-component work

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/partials/accessibility.ts` | Announcement store + focus trap action | ~60 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.svelte` | Add skip link, landmark roles, live region |
| `src/app.css` | Add `.sr-only` utility, reduced motion query |
| All modal/drawer components | Add focus trap + restore |
| All button/interactive components | Ensure 44×44px minimum, aria-label where icon-only |
| Channel sidebar, message list | Keyboard arrow navigation |
| Theme colors | Verify/adjust contrast ratios |

---

## Testing

Use these tools for automated and manual audits:
- **axe-core** (automated WCAG scanner, integrates with Cypress)
- **Lighthouse** accessibility audit
- **Manual keyboard testing** — Tab through entire app flow
- **VoiceOver / NVDA** — test real screen reader experience

---

## Verification

- [ ] Skip link visible on Tab, jumps to `<main>`
- [ ] Modal open → focus inside modal; modal close → focus returns
- [ ] New message → screen reader announces (aria-live)
- [ ] New alert → screen reader announces (assertive)
- [ ] All text meets 4.5:1 contrast ratio on both themes
- [ ] Encryption status communicates without color alone
- [ ] `prefers-reduced-motion` → no animations
- [ ] All buttons ≥ 44×44px touch target
- [ ] Entire app navigable by keyboard alone (no traps)
- [ ] axe-core reports zero critical violations
