# Wareneingang — Modern 2026 Animations

Documentation for the animation layer added in `css/animations.css`.

---

## Overview

The animation system is built exclusively on **cutting-edge CSS techniques** that became
stable or baseline in 2024–2025 and represent the state of the art in 2026:

| Technique | Browser support | Purpose |
|---|---|---|
| `@starting-style` | Chrome 117+, Firefox 129+, Safari 17.5+ | Entry effects on first render |
| `animation-timeline: view()` | Chrome 115+, Firefox 110+, Safari 18+ | Scroll-driven reveal |
| `@property` | Baseline (all modern browsers) | Animatable CSS custom properties |
| `interpolate-size: allow-keywords` | Chrome 129+, Safari 18.2+ | Animate `height: auto` |
| `linear()` easing | Chrome 113+, Firefox 112+, Safari 17.2+ | Spring / physics easing |
| `view-transition-name` | Chrome 111+, Firefox 130+, Safari 18+ | Cross-state view transitions |
| `transition-behavior: allow-discrete` | Chrome 117+, Firefox 129+, Safari 17.4+ | Animate `display` on/off |

All animations are wrapped in `@media (prefers-reduced-motion: no-preference)` and a
global `@media (prefers-reduced-motion: reduce)` block strips all motion for users
who request it.

---

## Technique Details

### 1. `interpolate-size: allow-keywords`

Applied globally on `:root`. Enables the browser to smoothly transition properties
that target intrinsic sizes (`height: auto`, `width: min-content`, etc.) — something
that previously required JavaScript hacks or `max-height` tricks.

```css
:root {
  interpolate-size: allow-keywords;
}
```

### 2. `@property` — Animatable Custom Properties

Three custom properties are registered with typed syntax so the browser knows how
to interpolate them across keyframes:

| Property | Type | Used for |
|---|---|---|
| `--gradient-angle` | `<angle>` | Rotating conic gradient on the header icon badge |
| `--glow-opacity` | `<number>` | Reserved for future glow effects |
| `--shimmer-pos` | `<percentage>` | Shimmer sweep position on the primary button |

```css
@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
```

### 3. `@starting-style` — Entry Effects

`@starting-style` sets the *pre-first-render* state of an element. Combined with a
`transition`, this creates smooth **entry animations without JavaScript**:

- **Main card** — fades in from `opacity: 0` and slides up from `translate: 0 2rem`.
- **Notification banner** — slides down from `-0.75rem` when it becomes visible.
  Uses `transition-behavior: allow-discrete` to animate the `display` property
  between `none` and `flex`.
- **Results chip** — scales from `0.85` to `1` when first rendered.

### 4. Scroll-Driven Animations (`animation-timeline: view()`)

Elements animate based on their visibility in the scrollport — no `IntersectionObserver`
JavaScript required:

| Element | Range | Effect |
|---|---|---|
| `.stat-card` | `entry 0% → entry 35%` | Staggered `fade-up` (6-step delay) |
| `.stats-panel` | `entry 0% → entry 40%` | `fade-up` |
| `.table-row` | `entry 0% → entry 50%` | `fade-up` per row |

The `animation-range` shorthand controls *when* within the entry phase the animation
plays, allowing fine-grained control without JavaScript.

> **Firefox note:** `animation-duration: 1ms` is set on scroll-driven animations as
> Firefox requires an explicit duration for scroll timelines to function.

### 5. Spring Easing with `linear()`

The `linear()` function accepts a list of easing stops that approximate a physical
spring, producing the "snap past and settle" feel of native mobile UIs:

```css
--ease-spring-3:
  linear(
    0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25%,
    0.849 31.1%, 0.938 38.1%, 0.968 41.8%,
    1.01 48%, 1.017 52.1%, 1.01 56.4%,
    0.997 71.7%, 0.999 80.1%, 1
  );
```

Two spring presets are provided:

- `--ease-spring-2` — gentler, fewer oscillations (stat-card lift, notification slide)
- `--ease-spring-3` — bouncier, more playful (filter checkmark pop, button hover)

### 6. View Transitions (`view-transition-name`)

`view-transition-name` is assigned to key UI regions so that when JavaScript
triggers `document.startViewTransition()`, the old and new states of each element
cross-fade with custom animations rather than a full-page blink:

| Element | `view-transition-name` | Transition |
|---|---|---|
| `.card-glass` | `main-card` | Default cross-fade |
| `#notificationBanner` | `notification` | Old fades out; new slides down |
| `#validationSummary` | `summary-area` | Old fades out; new fades up |
| `#validationWrapper` | `validation-wrapper` | Old fades out; new fades up |
| `#tableWrapper` | `table-wrapper` | Old fades out; new fades up |

### 7. Shimmer Sweep (Button Hover)

The primary action button gets a light shimmer sweep on hover using an `@property`
`<percentage>` value animated across a `linear-gradient`. This technique does not
use `background-position` (which can cause layout issues) — instead the gradient
itself is rewritten using the custom property:

```css
background: linear-gradient(
  105deg,
  transparent calc(var(--shimmer-pos) - 20%),
  rgba(255, 255, 255, 0.18) var(--shimmer-pos),
  transparent calc(var(--shimmer-pos) + 20%)
);
```

### 8. Drop Zone Pulse

When a file is dragged over the drop zone, a `badge-pulse` animation fires — a
repeating CSS `box-shadow` ring that expands and fades, indicating an active drop
target without relying on JavaScript state:

```css
.drop-zone.drag-over {
  animation: badge-pulse 1.4s var(--ease-standard) infinite;
}
```

---

## Accessibility

- All animations are gated behind `@media (prefers-reduced-motion: no-preference)`.
- A catch-all `@media (prefers-reduced-motion: reduce)` block sets
  `animation-duration: 0.01ms` and `transition-duration: 0.01ms` on every element,
  ensuring no motion leaks through.
- The loading spinner is explicitly disabled (`animation: none`) in reduced-motion
  mode rather than just sped up.
- No animation conveys information that is not also communicated through text or
  colour alone.

---

## File Structure

```
wareneingang/
└── css/
    ├── main.css          Design tokens, base styles, components
    └── animations.css    ← This file — all motion and transition rules
```

The animation layer is deliberately separated from `main.css` to keep concerns
isolated and to make it easy to disable all animations by simply removing the
`<link>` tag.

---

## Browser Support

Animations degrade gracefully:

- **No animation support at all** → elements appear in their final state instantly.
- **Partial support** (e.g. Safari without scroll-driven) → `@starting-style` and
  `@property` animations still work; scroll-driven fallback to instant appearance.
- **Full support** (Chrome 129+, Firefox 129+, Safari 18.2+) → all animations play.
