# Design System — Music Hub

Design language: Swiss industrial / editorial. Restrained, legible, "quietly premium."
Accent: **#C84B11** (burnt orange) — used sparingly for active/selection/critical states only.

---

## 1. Color Tokens

All defined as CSS custom properties in `src/style.css`.

### Background
| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#F4F3F0` | Warm off-white canvas (app background) |
| `--color-surface` | `#FFFFFF` | Cards, modals, panels |
| `--color-surface-raised` | `#FAFAF8` | Slightly elevated surfaces |
| `--color-sidebar` | `#EDECE9` | Sidebar background |

### Borders
| Token | Value | Usage |
|---|---|---|
| `--color-border` | `#E0DED9` | Hairline dividers, default borders |
| `--color-border-strong` | `#C8C5BF` | Stronger separators, form inputs |

### Text
| Token | Value | Usage |
|---|---|---|
| `--color-text` | `#131211` | Body text, headings |
| `--color-text-secondary` | `#6B6762` | Labels, metadata, nav items |
| `--color-text-tertiary` | `#9E9A95` | Placeholders, section labels |
| `--color-text-inverse` | `#FFFFFF` | Text on dark/accent surfaces |

### Accent (burnt orange — use sparingly)
| Token | Value | Usage |
|---|---|---|
| `--color-accent` | `#C84B11` | Active nav item, focus rings, CTAs |
| `--color-accent-hover` | `#A83A0C` | Hovered accent |
| `--color-accent-subtle` | `rgba(200,75,17,.08)` | Active row background |
| `--color-accent-subtle2` | `rgba(200,75,17,.15)` | Pills, badges on active items |

### Semantic
| Token | Value |
|---|---|
| `--color-danger` | `#C0392B` |
| `--color-success` | `#1A7A4A` |
| `--color-warning` | `#B8691A` |

---

## 2. Typography Scale

| Token | Size | Weight | Letter-spacing | Usage |
|---|---|---|---|---|
| `--text-display` | `clamp(28px,3.5vw,40px)` | 700 | -0.02em | Page hero titles |
| `--text-heading` | `20px` | 600 | -0.01em | Section headings |
| `--text-subheading` | `16px` | 600 | -0.005em | Card titles, sub-sections |
| `--text-body` | `14px` | 400 | — | Default body text |
| `--text-small` | `13px` | 400 | — | Secondary text, nav items |
| `--text-caption` | `11px` | 500 | +0.06em + uppercase | Section labels, table headers |
| `--text-utility` | `11px` | 600 | +0.10em + uppercase | Badge text, status labels |

Font stack: SF Pro Text → Helvetica Neue → Arial → system-ui.

**Utility classes:** `.text-display`, `.text-heading`, `.text-subheading`, `.text-body`, `.text-small`, `.text-caption`, `.text-utility`

---

## 3. Spacing Scale

Based on a 4px grid.

| Token | Value | Compact |
|---|---|---|
| `--space-1` | 4px | 2px |
| `--space-2` | 8px | 6px |
| `--space-3` | 12px | 8px |
| `--space-4` | 16px | 12px |
| `--space-5` | 20px | 14px |
| `--space-6` | 24px | 18px |
| `--space-8` | 32px | 24px |
| `--space-10` | 40px | 32px |
| `--space-12` | 48px | 40px |

---

## 4. Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 3px | Small controls, tags |
| `--radius-md` | 6px | Buttons, inputs, context menus |
| `--radius-lg` | 10px | Cards, panels |
| `--radius-xl` | 14px | Modals |

---

## 5. Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.08)` | Subtle elevation (cards) |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.10)` | Dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,.12)` | Context menus |
| `--shadow-overlay` | `0 20px 48px rgba(0,0,0,.18)` | Modals |

---

## 6. Motion

| Token | Value | Usage |
|---|---|---|
| `--motion-fast` | `150ms ease` | Hovers, micro interactions |
| `--motion-default` | `200ms ease` | State changes, toggles |
| `--motion-slow` | `300ms ease` | Page transitions, expanded panels |

All motion respects `prefers-reduced-motion: reduce` (durations collapse to 0.01ms).

---

## 7. Components

### Buttons

| Class | Usage |
|---|---|
| `.btn-primary` | Default CTA — dark fill |
| `.btn-secondary` | Secondary action — bordered |
| `.btn-ghost` | Tertiary/inline — no border |
| `.btn-accent` | Accent-colored CTA (use rarely) |
| `.btn-secondary.danger` | Destructive action |

**States:** `:hover`, `:focus-visible` (2px accent ring), `:disabled` (40% opacity).

**DO NOT** use `.btn-accent` for every button. Reserve it for 1 primary CTA per screen max.

### Inputs

All `input`, `select`, `textarea` elements inherit base styling automatically.
Focus: 2px accent ring + accent border.

**Special:** `.input-primary` class for explicit control.

### Cards

`.card` → `.card-header` + `.card-body` + `.card-footer`

Cards sit on `--color-surface` (white). No shadow by default — use a border. Add `shadow-md` only when cards float above the canvas (e.g., dropdowns).

### Modals

`.modal-backdrop` → `.modal-container`

Max-width: 520px (standard), 800px (wide settings modal).
Use `border-radius: var(--radius-xl)` on container.

### Badges / Pills

`.badge .badge-default|accent|success|danger|warning`

### Navigation

List-based, numbered rows, hairline dividers (`--color-border`).
Active state: left accent border + accent text + subtle background.

Nav item anatomy:
```
.nav-item
  .nav-item-num   (01, 02, ...)
  svg icon
  .nav-item-label
  .nav-count      (optional pill)
```

### Tables

`.data-table` — hairline dividers between rows, capitalized column headers.

Compact mode auto-reduces padding via CSS token overrides.

---

## 8. Compact Mode

**How to toggle:** A control in Preferences → Appearance → Density.

**How it works:**
- `html.compact` class is added/removed by `PreferencesModal.vue`
- Preference is persisted to `localStorage` under `mhDensity`
- On app mount, `App.vue` reads the stored value and applies the class

**Effect:** Reduces all spacing tokens, nav item height, and text-body/small by ~1-2px. Information density increases ~30% without harming legibility.

---

## 9. Do / Don't

| DO | DON'T |
|---|---|
| Use hairline borders (`--color-border`) for dividers | Use heavy `border-2` or dark borders |
| Use accent color for exactly one CTA per view | Use accent for decorative elements |
| Capitalize section labels with `.text-caption` | Use title-case or sentence-case for labels |
| Use `var(--space-*)` tokens for all spacing | Hard-code pixel values inline |
| Use subtle background on hover (`rgba(0,0,0,0.04)`) | Use colored backgrounds on hover |
| Number nav items (01, 02…) for Swiss feel | Show icons only in sidebar |
| Use `--shadow-overlay` for modals only | Use heavy shadows on flat cards |
| Respect `prefers-reduced-motion` | Add gratuitous animations |

---

## 10. File Locations

| File | Purpose |
|---|---|
| `src/style.css` | All tokens + global classes |
| `tailwind.config.js` | Tailwind ↔ token wiring |
| `src/App.vue` | App shell, sidebar, navigation |
| `src/components/PreferencesModal.vue` | Density toggle, preferences |
| `docs/design-system.md` | This file |
