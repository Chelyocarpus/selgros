# Wareneingang — Style Guide 2026

> Based on 2026 web design trends: glassmorphism 2.0, bento grid layouts, aurora gradients, token-based design, and refined micro-interactions.

---

## 1. Design Philosophy

| Principle | Description |
|---|---|
| **Clarity First** | Data surfaces must be legible at a glance. No decoration at the expense of readability. |
| **Subtle Depth** | Layered surfaces through shadow and translucency — not skeuomorphism. |
| **Intentional Motion** | Every transition has a purpose. Respects `prefers-reduced-motion`. |
| **Accessible by Default** | WCAG AA contrast, keyboard navigation, ARIA attributes, `sr-only` labels throughout. |
| **Token-Driven** | All colors, spacing, and radii are CSS custom properties — never hard-coded. |

---

## 2. Color System

### Base Palette

```css
/* Background */
--color-bg:             #f4f4f5;   /* Page background — neutral zinc */
--color-bg-mesh-a:      #d4d4d8;   /* Ambient blob A — mid zinc */
--color-bg-mesh-b:      #e4e4e7;   /* Ambient blob B — light zinc */
--color-bg-mesh-c:      #a1a1aa;   /* Ambient blob C — darker zinc */

/* Surface (card) layers */
--color-surface:        #ffffff;
--color-surface-hover:  #f4f4f5;
--color-surface-raised: #ffffff;   /* elevated modal/tooltip */

/* Borders */
--color-border:         rgba(212, 212, 216, 0.8);
--color-border-strong:  #d4d4d8;
--color-border-focus:   #18181b;
```

### Semantic Colors

```css
/* Accent — Near-black / Charcoal (primary action) */
--color-accent:         #18181b;
--color-accent-dark:    #09090b;
--color-accent-soft:    #f4f4f5;
--color-accent-text:    #27272a;

/* Success — Emerald (normal / ok ) */
--color-success:        #10b981;
--color-success-dark:   #059669;
--color-success-soft:   #ecfdf5;
--color-success-text:   #065f46;

/* Warning — Amber */
--color-warning:        #f59e0b;
--color-warning-dark:   #d97706;
--color-warning-soft:   #fffbeb;
--color-warning-text:   #78350f;

/* Danger — Red (Falschbuchungen) */
--color-danger:         #ef4444;
--color-danger-dark:    #dc2626;
--color-danger-soft:    #fef2f2;
--color-danger-text:    #7f1d1d;

/* Info — Blue (Genullt) */
--color-info:           #3b82f6;
--color-info-dark:      #2563eb;
--color-info-soft:      #eff6ff;
--color-info-text:      #1e3a8a;

/* Neutral */
--color-purple:         #8b5cf6;
--color-purple-soft:    #f5f3ff;
--color-purple-text:    #4c1d95;
```

### Text Colors

```css
--color-text-primary:   #09090b;  /* Headings, labels */
--color-text-secondary: #52525b;  /* Body / sub-labels */
--color-text-tertiary:  #a1a1aa;  /* Placeholder, meta */
--color-text-on-dark:   #f4f4f5;  /* Text on dark backgrounds */
--color-text-on-accent: #ffffff;  /* Text on near-black */
```

---

## 3. Typography

**Font Family**: `'Inter', system-ui, -apple-system, sans-serif`
Loaded via Google Fonts with `display=swap` and subset optimisation.

| Role | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| `--type-display` | 2rem (32px) | 800 | 1.2 | Page/hero titles |
| `--type-heading-lg` | 1.5rem (24px) | 700 | 1.3 | Section headings |
| `--type-heading-md` | 1.25rem (20px) | 600 | 1.4 | Card headings |
| `--type-heading-sm` | 1rem (16px) | 600 | 1.5 | Sub-section headings |
| `--type-body` | 0.875rem (14px) | 400 | 1.6 | Default body text |
| `--type-small` | 0.75rem (12px) | 400 | 1.5 | Metadata, captions |
| `--type-label` | 0.6875rem (11px) | 600 | 1.4 | ALL-CAPS labels |

**Tracking for labels**: `letter-spacing: 0.08em` — always uppercase.

---

## 4. Spacing

The spacing scale follows a base-4 system:

```
--space-1:  0.25rem  (4px)
--space-2:  0.5rem   (8px)
--space-3:  0.75rem  (12px)
--space-4:  1rem     (16px)
--space-6:  1.5rem   (24px)
--space-8:  2rem     (32px)
--space-10: 2.5rem   (40px)
--space-12: 3rem     (48px)
```

---

## 5. Border Radius

```
--radius-sm:   0.375rem  (6px)   — Input fields, small chips
--radius-md:   0.75rem   (12px)  — Cards, buttons
--radius-lg:   1rem      (16px)  — Large cards
--radius-xl:   1.5rem    (24px)  — Hero card, modals
--radius-full: 9999px            — Pills, badges, avatars
```

---

## 6. Shadows

Inspired by material layering — shadows include a small color tint for soft ambient glow:

```css
--shadow-sm:  0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04);
--shadow-md:  0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04);
--shadow-lg:  0 12px 32px rgba(15,23,42,0.1), 0 4px 8px rgba(15,23,42,0.06);
--shadow-accent:  0 8px 24px rgba(99,102,241,0.25);  /* indigo glow */
--shadow-success: 0 4px 12px rgba(16,185,129,0.2);
--shadow-danger:  0 4px 12px rgba(239,68,68,0.2);
--shadow-info:    0 4px 12px rgba(59,130,246,0.2);
```

---

## 7. Components

### 7.1 Cards

Three surface levels:

| Class | Description |
|---|---|
| `.card` | Base card — white bg, border, `--shadow-md`, `--radius-lg` |
| `.card-raised` | Elevated card — stronger shadow, slight scale on hover |
| `.card-glass` | Glassmorphic surface — `backdrop-filter: blur(24px)`, semi-transparent |

```css
/* Base card */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

/* Glassmorphic card */
.card-glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
```

### 7.2 Bento Grid Stat Cards

The primary data display pattern — inspired by Apple bento at WWDC and widely adopted in 2025–2026 product UIs.

```
┌────────────────┬────────────────┬────────────────┐
│ TOTAL ROWS     │ NORMAL         │ FALSCHBUCHUNGEN │
│                │                │                 │
│      2,847     │     2,804      │       31        │
│                │ ░░░░░░░░░░░░░  │ ░░░░░░░░░░░░░   │
└────────────────┴────────────────┴────────────────┘
```

Rules:
- Top accent stripe (4px) in semantic color
- Large number (`--type-display`) with high contrast
- ALL-CAPS micro-label above number
- `border-l` removed in favor of `border-t` accent (2026 convention)
- Hover: subtle lift + deepened shadow

### 7.3 Buttons

```
Primary:   near-black bg (#18181b) → black (#09090b) on hover, scale(0.98) on active
Secondary: white bg + zinc border → zinc-soft bg on hover
Ghost:     transparent → zinc-soft bg on hover
Danger:    red-soft bg → red bg on hover
```

Button shadow: `--shadow-accent` — `0 8px 24px rgba(9,9,11,0.22)` (dark grey, not coloured).

Minimum touch target: 44×44px.
Keyboard visible focus ring: `2px solid var(--color-border-focus)` (`#18181b`) with `2px offset`.

### 7.4 Filter Chips (Toggle Cards)

Checked state:
- Border changes to semantic color
- Background becomes semantic soft color
- Checkmark icon fades in
- Drop shadow deepens with color-tinted glow

The **unchecked default fallback** uses zinc (`#18181b`) instead of any blue tint:

```css
.filter-checkbox:checked + .filter-card-content {
  border-color: var(--filter-active, #18181b);
  background: var(--filter-soft, #f4f4f5);
  box-shadow: 0 4px 16px -2px var(--filter-shadow, rgba(9,9,11,0.18));
}
```

### 7.5 Notifications / Alerts

2026 convention: inline status banners (not floating toasts) with:
- Frosted/tinted background
- Bold left border (4px) in semantic color
- SVG icon aligned to text baseline
- Dismiss button (ghost `x`)
- `aria-live` regions for screen readers

| Type | Background | Border | Icon Color |
|---|---|---|---|
| Info | `--color-info-soft` | `--color-info` | `--color-info` |
| Success | `--color-success-soft` | `--color-success` | `--color-success` |
| Warning | `--color-warning-soft` | `--color-warning` | `--color-warning` |
| Error | `--color-danger-soft` | `--color-danger` | `--color-danger` |
| Processing | `--color-accent-soft` | `--color-accent` | `--color-accent` |

### 7.6 Data Tables

2026 convention: borderless inside rows, header separator only:

```
Thead: bg surface-raised, sticky, with subtle bottom border (2px)
Tbody row even: transparent
Tbody row odd: rgba(15,23,42,0.018) — near-invisible zebra stripe
Row hover: accent-soft background transition (150ms ease)
Target cell: bold weight + semantic soft bg
Left row indicator strip: 3px solid semantic color
```

---

## 8. Aurora Background

Inspired by Apple's visionOS ambient aesthetic. The blobs use **neutral zinc greys** to create gentle tonal depth without any hue shift — the palette stays strictly achromatic outside of the semantic status colours.

```css
body::before {
  width: 700px; height: 700px;
  background: radial-gradient(circle, var(--color-bg-mesh-a) 0%, transparent 70%);
  /* --color-bg-mesh-a: #d4d4d8 — mid zinc */
  top: -250px; right: -150px;
  opacity: 0.4;
}

body::after {
  width: 600px; height: 600px;
  background: radial-gradient(circle, var(--color-bg-mesh-c) 0%, transparent 70%);
  /* --color-bg-mesh-c: #a1a1aa — darker zinc */
  bottom: -200px; left: -150px;
  opacity: 0.3;
}

/* animation definitions unchanged — still aurora-a / aurora-b keyframes */

@media (prefers-reduced-motion: reduce) {
  body::before,
  body::after { animation: none; }
}
```

---

## 9. Motion & Animation

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | `150ms` | Hover color transitions |
| `--duration-base` | `200ms` | Default panel/card transitions |
| `--duration-slow` | `300ms` | Page-level fade-ins |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | All standard easing |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Button press bounce |

All animations must:
1. Use `@media (prefers-reduced-motion: no-preference)` wrapper OR check `body.reduced-motion`
2. Have a `will-change` hint only when genuinely transforming
3. Never block interaction (avoid JS-driven animations on critical paths)

---

## 10. Iconography

- Use **inline SVGs** — no external icon font requests
- Stroke-based icons (`fill="none" stroke="currentColor"`) for UI chrome
- Stroke-width: **1.5** for decorative, **2** for functional icons
- Size: `16×16` inline, `20×20` for button icons, `24×24` for section icons
- Color: `currentColor` to inherit from parent text color

---

## 11. Accessibility

| Requirement | Implementation |
|---|---|
| Colour contrast | All text ≥ 4.5:1 against background |
| Focus indicators | 2px solid `--color-border-focus`, 2px offset, visible in dark mode |
| Skip link | First element in `<body>`, visible on focus |
| Interactive elements | Minimum 44px touch target |
| Loading states | `aria-live="polite"` on status regions |
| Tables | `role="table"`, `scope="col"` on `<th>`, `aria-label` on target cells |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables all transitions |

---

## 12. Grid & Layout

- Max content width: `1280px` (with side padding)
- Card column: `max-w-4xl` (`896px`) for input forms
- Table / results: full width with horizontal scroll on mobile
- Stat bento grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` with `gap-4`
- Filter grid: `grid-cols-1 sm:grid-cols-3` with `gap-3`

---

### 7.6 Drop Zone

The file-upload drop target uses a **zinc-grey** dashed border and fill — no blue tint:

```css
.drop-zone {
  border: 2px dashed rgba(24, 24, 27, 0.22);
  background: rgba(244, 244, 245, 0.6);
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #18181b;
  background: rgba(228, 228, 231, 0.7);
}
```

### 7.7 App Header

The page header uses a **near-black gradient** (`#09090b` → `#27272a`) with a white dot-grid texture overlay and a subtle circular highlight in the top-right corner.

Subtitle text uses `text-zinc-400` (`#a1a1aa`) — light enough to read on the dark background, yet clearly secondary to the white title.

---

*Last updated: 2026-02-22*
